import { useEffect, useRef } from "react";
import {
  canNotify,
  ensureNotifyPermission,
  showAppNotification,
  vibrateMessagePattern,
} from "@/lib/app-notify";
import { CHAT_CLOSED_JOB_STATUSES } from "@/lib/notifications/types";
import { playPersonTone } from "@/lib/sound-tone";
import { useApp } from "@/lib/store";
import { loadSeenAnchors, saveSeenAnchors, type Banner } from "./seen-anchors";

export function useInboundDetection(
  pathname: string,
  showBanner: (b: NonNullable<Banner>) => void,
) {
  const { messages, requests, backendUserId, accountType } = useApp();
  /** Identity (userId|role) the anchors below were seeded for changing roles
   * or accounts must re-seed so the other role's history never re-pops. */
  const primedFor = useRef<string>("");
  /** Per-thread latest inbound message timestamp already absorbed/surfaced. */
  const anchors = useRef<Map<string, string>>(new Map());

  // Detect new inbound messages → tone + system notify + in-app banner.
  // Anchored per thread: history loaded at any time (reload, role switch,
  // refresh re-ordering) only seeds the anchor it never re-pops. Only a
  // message NEWER than what we've already absorbed, on an ACTIVE job chat,
  // surfaces. Closed / historical job chats never pop, even when the linked
  // job isn't in the recent live request list.
  useEffect(() => {
    if (!backendUserId || !accountType || !messages.length) return;

    const identity = `${backendUserId}|${accountType}`;
    if (primedFor.current !== identity) {
      primedFor.current = identity;
      // Re-seed from what this role already absorbed before the reload old
      // chat history stays silent no matter how fast/slow the first fetch is.
      anchors.current = new Map(Object.entries(loadSeenAnchors(accountType)));
    }

    type Inbound = {
      at: string;
      who: string;
      text: string;
      threadId: string;
      name: string;
    };

    const inboundByThread = new Map<string, Inbound>();
    for (const th of messages) {
      // Chat only with a real request no orphan threads
      if (!th.requestId || th.requestId.startsWith("chat-")) continue;
      for (const m of th.messages) {
        if (m.sender === "system") continue;
        const mine =
          (accountType === "professional" && m.sender === "professional") ||
          (accountType === "motorist" && m.sender === "motorist");
        if (mine) continue;
        const prev = inboundByThread.get(th.id);
        if (!prev || m.at > prev.at) {
          inboundByThread.set(th.id, {
            at: m.at,
            who:
              m.sender === "professional"
                ? th.technicianId || th.technicianName
                : th.motoristName,
            name:
              m.sender === "professional" ? th.technicianName : th.motoristName,
            text: m.text || "New message",
            threadId: th.id,
          });
        }
      }
    }

    // First sighting of a thread = history. Seed it and stay silent. Only a
    // strictly newer message than the seed can ever pop.
    const candidates: Inbound[] = [];
    for (const inbound of inboundByThread.values()) {
      const prev = anchors.current.get(inbound.threadId);
      if (prev == null) {
        anchors.current.set(inbound.threadId, inbound.at);
        continue;
      }
      if (inbound.at <= prev) continue;
      // Closed / historical job chat never pop. The job must be live and
      // present in the recent request list, else it's old history.
      const thread = messages.find((t) => t.id === inbound.threadId);
      const job = thread
        ? requests.find((r) => r.id === thread.requestId)
        : undefined;
      if (!job) continue; // job status not loaded yet → hold for a later run
      if (CHAT_CLOSED_JOB_STATUSES.has(job.status)) {
        anchors.current.set(inbound.threadId, inbound.at);
        continue;
      }
      candidates.push(inbound);
    }
    // Absorb everything whose job status is known so identical data never
    // re-fires; unknown-status threads stay pending until their job loads.
    for (const inbound of inboundByThread.values()) {
      const prev = anchors.current.get(inbound.threadId) ?? "";
      if (inbound.at <= prev) continue;
      const thread = messages.find((t) => t.id === inbound.threadId);
      const job = thread
        ? requests.find((r) => r.id === thread.requestId)
        : undefined;
      if (job) anchors.current.set(inbound.threadId, inbound.at);
    }
    saveSeenAnchors(accountType, anchors.current);

    if (!candidates.length) return;
    const latest = candidates.reduce((a, b) => (b.at > a.at ? b : a));

    // Already viewing this thread soft tone only
    const onThisThread =
      pathname === `/messages/${latest.threadId}` ||
      pathname.startsWith(`/messages/${latest.threadId}`);

    playPersonTone(latest.who, "message");
    vibrateMessagePattern();

    if (!onThisThread) {
      showBanner({
        kind: "message",
        id: latest.threadId,
        title: latest.name || "New message",
        body: latest.text.slice(0, 120),
        href: `/messages/${latest.threadId}`,
        who: latest.who,
      });
      if (canNotify()) {
        showAppNotification({
          title: latest.name || "Ona",
          body: latest.text.slice(0, 140),
          tag: `msg-${latest.threadId}`,
          href: `/messages/${latest.threadId}`,
        });
      } else {
        void ensureNotifyPermission().then((p) => {
          if (p === "granted") {
            showAppNotification({
              title: latest.name || "Ona",
              body: latest.text.slice(0, 140),
              tag: `msg-${latest.threadId}`,
              href: `/messages/${latest.threadId}`,
            });
          }
        });
      }
    }
  }, [messages, requests, backendUserId, accountType, pathname, showBanner]);
}
