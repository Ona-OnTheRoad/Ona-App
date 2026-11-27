import { useCallback, useMemo } from "react";
import { mergeServerThreads, threadMatchesId } from "@/lib/chat-merge";
import { playPersonTone } from "@/lib/sound-tone";
import {
  backendEnsureConversation,
  backendFetchConversations,
  backendMarkMessagesRead,
  backendSendMessage,
  backendUploadVoice,
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
            if (threads.length) {
              setMessages((prev) => mergeServerThreads(prev, threads));
            }
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

  /** Update one message of a thread, or remove it when `patch` is null. */
  const patchMessage = useCallback(
    (threadId: string, msgId: string, patch: Partial<ChatMessage> | null) => {
      setMessages((prev) =>
        prev.map((t) =>
          threadMatchesId(t, threadId)
            ? {
                ...t,
                messages: patch
                  ? t.messages.map((m) =>
                      m.id === msgId ? { ...m, ...patch } : m,
                    )
                  : t.messages.filter((m) => m.id !== msgId),
              }
            : t,
        ),
      );
    },
    [setMessages],
  );

  /**
   * Deliver one message already shown in the chat. Voice notes are uploaded to
   * storage first, then sent as a small pointer. On any failure the message
   * stays in the chat marked "failed" so it can be retried, never erased.
   */
  const deliverMessage = useCallback(
    async (threadId: string, msg: ChatMessage) => {
      if (!backendUserId || !accountType) return;
      patchMessage(threadId, msg.id, { status: "sending" });
      const fail = () => patchMessage(threadId, msg.id, { status: "failed" });

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
        if (!hit) {
          console.warn("sendChatMessage: no cloud conversation for", requestId);
          fail();
          return;
        }
        conversationId = hit.id;
        setMessages((prev) => mergeServerThreads(prev, threads));
      }

      let voice: { key: string; durationSec: number | null; mime: string } | null =
        null;
      if (msg.voiceUrl) {
        const up = await backendUploadVoice({
          conversationId,
          dataUrl: msg.voiceUrl,
          mime: msg.voiceMime || "audio/webm",
        });
        if ("error" in up) {
          console.warn("sendChatMessage: voice upload failed", up.error);
          fail();
          return;
        }
        voice = {
          key: up.key,
          durationSec: msg.voiceDurationSec ?? null,
          mime: up.mime,
        };
      }

      const caption = msg.text && msg.text !== "Voice note" ? msg.text : "";
      const err = await backendSendMessage({
        conversationId,
        senderId: backendUserId,
        body: voice ? caption : msg.text,
        voice,
      });
      if (err) {
        console.warn("sendChatMessage failed", err);
        fail();
        return;
      }
      // Delivered: drop the local copy, then pull the server's version.
      patchMessage(threadId, msg.id, null);
      const threads = await backendFetchConversations(
        backendUserId,
        accountType,
      );
      if (threads.length) {
        setMessages((prev) => mergeServerThreads(prev, threads));
      }
    },
    [accountType, backendUserId, patchMessage, setMessages],
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
      const online = isAppBackendOnline() && Boolean(backendUserId) && Boolean(accountType);
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        text: trimmed || "Voice note",
        at: new Date().toISOString(),
        voiceUrl: voice?.url || null,
        voiceDurationSec: voice?.durationSec ?? null,
        voiceMime: voice?.mime ?? null,
        status: online ? "sending" : undefined,
      };

      // Unique send chirp for this user
      playPersonTone(backendUserId || displayName || "me", "sent");

      // Optimistic update on matching thread
      setMessages((prev) =>
        prev.map((t) =>
          threadMatchesId(t, threadId)
            ? {
                ...t,
                lastMessage: preview,
                time: "now",
                messages: [...t.messages, msg],
              }
            : t,
        ),
      );

      if (online) void deliverMessage(threadId, msg);
    },
    [accountType, backendUserId, deliverMessage, displayName, setMessages],
  );

  /** Send a failed message again. */
  const retryChatMessage = useCallback(
    (threadId: string, msgId: string) => {
      const msg = messages
        .find((t) => threadMatchesId(t, threadId))
        ?.messages.find((m) => m.id === msgId);
      if (!msg || msg.status !== "failed") return;
      void deliverMessage(threadId, msg);
    },
    [deliverMessage, messages],
  );

  /** Remove a failed message from the chat without sending it. */
  const discardChatMessage = useCallback(
    (threadId: string, msgId: string) => patchMessage(threadId, msgId, null),
    [patchMessage],
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
    retryChatMessage,
    discardChatMessage,
    markThreadRead,
    visibleMessageThreads,
  };
}

export type ChatsResult = ReturnType<typeof useChats>;
