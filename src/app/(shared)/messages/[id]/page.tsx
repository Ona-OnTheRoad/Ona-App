"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { ChatComposer } from "@/components/messages/chat-composer";
import { ChatThreadMissing } from "@/components/messages/chat-thread-missing";
import { ChatMessageBubble } from "@/components/messages/chat-message-bubble";
import { useChatJobStatus } from "@/components/messages/use-chat-job-status";
import { useTypingChannel } from "@/components/messages/use-typing-channel";
import { useVoiceRecorder } from "@/components/messages/use-voice-recorder";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import {
  CONVERSATION_ENDED_MESSAGE,
  isReadOnlyChatUrl,
} from "@/lib/chat-expired";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  backendSubscribeMessages,
  type MessageRow,
} from "@/lib/supabase/app-api";

import { unlockAudio } from "@/lib/sound-tone";
import type { ChatMessage } from "@/lib/types";

/**
 * Single job chat: Motorist ↔ Repair Pro.
 * Polls + Realtime so both parties see each other's messages.
 * Ended jobs: popup → View (read-only) or OK (leave list).
 */
export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#c8c9cd]">
          <p className="text-sm font-semibold text-slate-700">Loading chat…</p>
        </div>
      }
    >
      <ChatThreadInner params={params} />
    </Suspense>
  );
}

function ChatThreadInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentionalViewOnly = isReadOnlyChatUrl(searchParams);
  const {
    visibleMessageThreads,
    sendChatMessage,
    refreshCloudChats,
    markThreadRead,
    theme,
    accountType,
    backendUserId,
  } = useApp();
  const notif = useNotificationsOptional();
  const isLight = theme === "light";
  const isPro = accountType === "professional";
  const thread = visibleMessageThreads.find((t) => t.id === id);
  /** Back to the request/job never a standalone messages inbox */
  const requestBackHref = (() => {
    const rid = thread?.requestId;
    if (rid && !rid.startsWith("chat-") && !rid.startsWith("demo-")) {
      return isPro ? `/jobs/${rid}` : `/jobs/${rid}`;
    }
    return isPro ? "/jobs" : "/requests";
  })();
  const [draft, setDraft] = useState("");
  const { chatClosed, expiredOpen, setExpiredOpen } = useChatJobStatus(
    thread?.requestId,
    intentionalViewOnly,
  );
  const {
    recPhase,
    pendingVoice,
    setPendingVoice,
    recError,
    startRec,
    stopRec,
  } = useVoiceRecorder(chatClosed);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { otherTyping, broadcastTyping } = useTypingChannel(
    id,
    backendUserId,
    chatClosed,
  );

  // Pull server messages once open; Realtime handles inserts rare poll backup
  useEffect(() => {
    refreshCloudChats();
    const t = window.setInterval(() => {
      if (document.hidden) return;
      refreshCloudChats();
    }, 120_000);
    return () => window.clearInterval(t);
  }, [refreshCloudChats, id]);

  // Mark thread + related message notifications as read when open / new msgs arrive
  useEffect(() => {
    if (!id || !thread) return;
    markThreadRead(id);
    if (notif) {
      const ids = notif.notifications
        .filter(
          (n) =>
            !n.readAt &&
            (n.category === "messages" || n.category === "requests") &&
            (n.href === `/messages/${id}` ||
              n.href === `/messages/${thread.id}` ||
              (thread.requestId != null && n.jobId === thread.requestId)),
        )
        .map((n) => n.id);
      if (ids.length) void notif.markRead(ids);
    }
  }, [id, thread?.id, thread?.messages.length, markThreadRead]); // eslint-disable-line react-hooks/exhaustive-deps

  const onExpiredOk = useCallback(() => {
    setExpiredOpen(false);
    const rid = thread?.requestId;
    if (rid && !rid.startsWith("chat-") && !rid.startsWith("demo-")) {
      router.replace(isPro ? `/jobs/${rid}` : `/requests/${rid}`);
      return;
    }
    router.replace(isPro ? "/jobs" : "/requests");
  }, [router, thread?.requestId, isPro, setExpiredOpen]);

  // Realtime inserts for this conversation (when id is a real UUID)
  useEffect(() => {
    if (!id || id.startsWith("chat-") || !backendUserId) return;
    const unsub = backendSubscribeMessages(id, (_row: MessageRow) => {
      refreshCloudChats();
      markThreadRead(id);
    });
    return () => {
      unsub?.();
    };
  }, [id, backendUserId, refreshCloudChats, markThreadRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length, pendingVoice, otherTyping]);

  if (!thread) {
    return (
      <ChatThreadMissing
        isLight={isLight}
        isPro={isPro}
        onBack={() => {
          refreshCloudChats();
          router.push(isPro ? "/jobs" : "/requests");
        }}
      />
    );
  }

  const title = isPro ? thread.motoristName : thread.technicianName;
  const subtitle = chatClosed
    ? `${PRO_SERVICE_LABELS[thread.serviceType] ?? thread.serviceType} · read only`
    : `${PRO_SERVICE_LABELS[thread.serviceType] ?? thread.serviceType} · job chat`;

  const send = () => {
    if (chatClosed) return;
    if (!draft.trim() && !pendingVoice) return;
    unlockAudio();
    broadcastTyping(false);
    sendChatMessage(thread.id, draft, pendingVoice);
    setDraft("");
    setPendingVoice(null);
  };

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
    >
      <PageHeader
        title={title}
        subtitle={subtitle}
        backHref={requestBackHref}
      />

      {chatClosed && (intentionalViewOnly || !expiredOpen) && (
        <div
          className={cn(
            "flex shrink-0 items-start gap-2 px-3 py-2",
            isLight ? "text-slate-800" : "text-white/85",
          )}
        >
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6B35]" />
          <p className="text-[11px] font-medium leading-snug">
            {CONVERSATION_ENDED_MESSAGE}
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2 scrollbar-hide">
        {thread.messages.map((msg: ChatMessage) => (
          <ChatMessageBubble
            key={msg.id}
            msg={msg}
            isPro={isPro}
            isLight={isLight}
          />
        ))}
        {otherTyping && !chatClosed && (
          <p
            className={cn(
              "px-2 text-[12px] italic transition-opacity duration-200",
              isLight ? "text-slate-600" : "text-white/65",
            )}
            aria-live="polite"
          >
            Typing…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {!chatClosed && pendingVoice && (
        <div className="px-3 pb-1">
          <VoiceNotePlayer
            url={pendingVoice.url}
            durationSec={pendingVoice.durationSec}
            isLight={isLight}
            label="Preview · play before send"
          />
          <button
            type="button"
            onClick={() => setPendingVoice(null)}
            className="mt-1 border-0 bg-transparent text-[11px] font-bold text-[#FF6B35]"
          >
            Discard voice
          </button>
        </div>
      )}
      {!chatClosed && recError && (
        <p className="px-3 text-[11px] font-semibold text-red-500">
          {recError}
        </p>
      )}

      {chatClosed ? (
        <div
          className={cn(
            "shrink-0 border-t px-3 py-3 text-center text-[12px] font-medium",
            isLight
              ? "border-black/10 text-slate-700"
              : "border-white/10 text-white/70",
          )}
        >
          Chat closed · view only
        </div>
      ) : (
        <ChatComposer
          isLight={isLight}
          recPhase={recPhase}
          draft={draft}
          setDraft={setDraft}
          pendingVoice={pendingVoice}
          startRec={startRec}
          stopRec={stopRec}
          send={send}
          broadcastTyping={broadcastTyping}
        />
      )}

      <ExpiredDialog
        open={expiredOpen}
        isLight={isLight}
        message={CONVERSATION_ENDED_MESSAGE}
        onClose={onExpiredOk}
        okLabel="OK"
      />
    </div>
  );
}
