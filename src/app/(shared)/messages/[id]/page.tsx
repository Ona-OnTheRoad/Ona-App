"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { ChatComposer } from "@/components/messages/chat-composer";
import { ChatThreadMissing } from "@/components/messages/chat-thread-missing";
import { ChatPeerHeader } from "@/components/messages/chat-peer-header";
import { ChatMessageBubble } from "@/components/messages/chat-message-bubble";
import { useChatJobStatus } from "@/components/messages/use-chat-job-status";
import { useTypingChannel } from "@/components/messages/use-typing-channel";
import { useVoiceRecorder } from "@/components/messages/use-voice-recorder";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { OnaScreen } from "@/components/ui/ona-screen";
import {
  clearPageExitClass,
  navigateBack,
  resolveBackHref,
} from "@/lib/navigation";
import {
  CONVERSATION_ENDED_MESSAGE,
  isReadOnlyChatUrl,
} from "@/lib/chat-expired";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { useApp } from "@/lib/store";
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
        <div className="ona2 flex h-full items-center justify-center">
          <p className="text-sm font-semibold text-ona-muted">Loading chat…</p>
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
  const pathname = usePathname() || "/";
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
  const { recPhase, pendingVoice, setPendingVoice, startRec, stopRec } =
    useVoiceRecorder(chatClosed);
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

  const handleBack = () => {
    clearPageExitClass();
    navigateBack(
      router,
      resolveBackHref(pathname, accountType, requestBackHref),
      accountType,
    );
  };

  const composer = (
    <>
      {!chatClosed && pendingVoice && (
        <div className="px-4 pb-1">
          <VoiceNotePlayer
            url={pendingVoice.url}
            durationSec={pendingVoice.durationSec}
            isLight={isLight}
            label="Preview · play before send"
          />
          <button
            type="button"
            onClick={() => setPendingVoice(null)}
            className="mt-1 h-11 border-0 bg-transparent text-[12px] font-semibold text-ona-brand-ink"
          >
            Discard voice
          </button>
        </div>
      )}
      {chatClosed ? (
        <div className="shrink-0 border-t border-ona-border px-4 py-3 text-center text-[12px] font-medium text-ona-muted">
          Chat closed · view only
        </div>
      ) : (
        <ChatComposer
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
    </>
  );

  return (
    <>
      <OnaScreen
        onBack={handleBack}
        bodyClassName="px-0 pb-0"
        footer={composer}
        footerClassName="p-0"
      >
        <ChatPeerHeader
          title={title}
          subtitle={subtitle}
          photo={thread.photo}
        />

        {chatClosed && (intentionalViewOnly || !expiredOpen) && (
          <div className="flex items-start gap-2 px-5 pt-3 text-ona-ink">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ona-brand-ink" />
            <p className="text-[12px] font-medium leading-snug">
              {CONVERSATION_ENDED_MESSAGE}
            </p>
          </div>
        )}

        <div className="space-y-3 px-5 py-4">
          {thread.messages.map((msg: ChatMessage) => (
            <ChatMessageBubble
              key={msg.id}
              msg={msg}
              isPro={isPro}
              isLight={isLight}
              senderName={title}
            />
          ))}
          {otherTyping && !chatClosed && (
            <p
              className="px-2 text-[12px] italic text-ona-muted transition-opacity duration-200"
              aria-live="polite"
            >
              Typing…
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </OnaScreen>

      <ExpiredDialog
        open={expiredOpen}
        isLight={isLight}
        message={CONVERSATION_ENDED_MESSAGE}
        onClose={onExpiredOk}
        okLabel="OK"
      />
    </>
  );
}
