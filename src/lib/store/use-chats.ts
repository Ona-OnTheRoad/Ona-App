import { useCallback, useMemo } from "react";
import { playPersonTone } from "@/lib/sound-tone";
import {
  backendEnsureConversation,
  backendFetchConversations,
  backendMarkMessagesRead,
  backendSendMessage,
  isAppBackendOnline,
} from "@/lib/supabase/app-api";
import type { ChatMessage, MessageThread, ServiceRequest } from "@/lib/types";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";

export function useChats(
  session: SessionStateResult,
  market: MarketStateResult,
) {
  const { displayName, accountType, backendUserId } = session;
  const { messages, setMessages } = market;

  const ensureChatForRequestAsync = useCallback(
    async (req: ServiceRequest): Promise<string> => {
      const localId = `chat-${req.id}`;

      // Prefer existing real server conversation
      let hitId: string | null = null;
      setMessages((prev) => {
        const existing = prev.find(
          (m) => m.requestId === req.id && m.id && !m.id.startsWith("chat-"),
        );
        if (existing) hitId = existing.id;
        return prev;
      });
      if (hitId) return hitId;

      if (isAppBackendOnline() && backendUserId && accountType) {
        const motoristId =
          accountType === "motorist" ? backendUserId : req.motoristId || "";
        const repairProId =
          accountType === "professional" ? backendUserId : req.technicianId;
        if (motoristId && repairProId) {
          const res = await backendEnsureConversation({
            requestId: req.id,
            motoristId,
            repairProId,
          });
          if (res.conversationId) {
            const threads = await backendFetchConversations(
              backendUserId,
              accountType,
            );
            if (threads.length) setMessages(threads);
            return res.conversationId;
          }
        }
      }

      // Local offline thread: empty until the user actually sends a message
      setMessages((prev) => {
        if (prev.some((m) => m.requestId === req.id || m.id === localId)) {
          return prev;
        }
        const thread: MessageThread = {
          id: localId,
          requestId: req.id,
          technicianId: req.technicianId,
          technicianName: req.technicianName,
          motoristName:
            accountType === "motorist" ? displayName || "Customer" : "Customer",
          serviceType: req.serviceType,
          lastMessage: "New chat",
          time: "now",
          unread: 0,
          photo: "",
          messages: [],
        };
        return [thread, ...prev];
      });
      return localId;
    },
    [displayName, backendUserId, accountType, setMessages],
  );

  const ensureChatForRequest = useCallback(
    (req: ServiceRequest): string => {
      void ensureChatForRequestAsync(req);
      return `chat-${req.id}`;
    },
    [ensureChatForRequestAsync],
  );

  const sendChatMessage = useCallback(
    (
      threadId: string,
      text: string,
      voice?: {
        url: string;
        durationSec?: number;
        mime?: string;
      } | null,
    ) => {
      const trimmed = text.trim();
      if (!trimmed && !voice?.url) return;
      const sender: ChatMessage["sender"] =
        accountType === "professional" ? "professional" : "motorist";
      const preview = voice?.url
        ? trimmed
          ? `🎤 ${trimmed}`
          : "🎤 Voice note"
        : trimmed;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        text: trimmed || "Voice note",
        at: new Date().toISOString(),
        voiceUrl: voice?.url || null,
        voiceDurationSec: voice?.durationSec ?? null,
        voiceMime: voice?.mime ?? null,
      };

      // Unique send chirp for this user
      playPersonTone(backendUserId || displayName || "me", "sent");

      // Optimistic update on matching thread
      setMessages((prev) =>
        prev.map((t) =>
          t.id === threadId ||
          (t.requestId &&
            (threadId === `chat-${t.requestId}` || threadId === t.requestId))
            ? {
                ...t,
                lastMessage: preview,
                time: "now",
                messages: [...t.messages, msg],
              }
            : t,
        ),
      );

      if (!isAppBackendOnline() || !backendUserId || !accountType) return;

      const body = voice?.url
        ? JSON.stringify({
            text: trimmed || "Voice note",
            voiceUrl: voice.url,
            voiceDurationSec: voice.durationSec ?? null,
            voiceMime: voice.mime ?? null,
          })
        : trimmed;

      void (async () => {
        // Resolve real conversation UUID (never insert with chat- local id)
        let conversationId = threadId;
        if (conversationId.startsWith("chat-")) {
          const requestId = conversationId.replace(/^chat-/, "");
          const threads = await backendFetchConversations(
            backendUserId,
            accountType,
          );
          const hit = threads.find(
            (th) => th.requestId === requestId || th.id === threadId,
          );
          if (hit) {
            conversationId = hit.id;
            setMessages(threads);
          } else {
            console.warn(
              "sendChatMessage: no cloud conversation for",
              requestId,
            );
            return;
          }
        }

        const err = await backendSendMessage({
          conversationId,
          senderId: backendUserId,
          body,
          senderName: displayName || null,
        });
        if (err) console.warn("sendChatMessage failed", err);
        // Pull latest so both devices stay in sync
        const threads = await backendFetchConversations(
          backendUserId,
          accountType,
        );
        if (threads.length) setMessages(threads);
      })();
    },
    [accountType, backendUserId, displayName, setMessages],
  );

  // Inbound message tone + banner handled by InboundBanner (app-wide)

  const markThreadRead = useCallback(
    (threadId: string) => {
      if (!threadId) return;
      setMessages((prev) =>
        prev.map((t) =>
          t.id === threadId ||
          (t.requestId &&
            (threadId === `chat-${t.requestId}` || threadId === t.requestId))
            ? { ...t, unread: 0 }
            : t,
        ),
      );
      if (!backendUserId || threadId.startsWith("chat-")) return;
      void backendMarkMessagesRead(threadId, backendUserId);
    },
    [backendUserId, setMessages],
  );

  // All chats for this account (skill filter hid pro job chats)
  const visibleMessageThreads = useMemo(() => messages, [messages]);
  return {
    ensureChatForRequestAsync,
    ensureChatForRequest,
    sendChatMessage,
    markThreadRead,
    visibleMessageThreads,
  };
}

export type ChatsResult = ReturnType<typeof useChats>;
