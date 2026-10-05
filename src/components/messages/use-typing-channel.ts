"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

/** Typing indicator channel (broadcast no extra DB rows). */
export function useTypingChannel(
  id: string,
  backendUserId: string | null | undefined,
  chatClosed: boolean,
) {
  /** Other party is typing (Realtime broadcast) */
  const [otherTyping, setOtherTyping] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typingChannelRef = useRef<any>(null);
  const typingStopTimer = useRef<number | null>(null);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    if (!id || id.startsWith("chat-") || !backendUserId || chatClosed) {
      setOtherTyping(false);
      return;
    }
    let sb: ReturnType<typeof createBrowserSupabase> | null = null;
    try {
      sb = createBrowserSupabase();
    } catch {
      return;
    }
    if (!sb) return;
    const channel = sb.channel(
      `om-typing:${id}-${Math.random().toString(36).slice(2, 8)}`,
      {
        config: { broadcast: { self: false } },
      },
    );
    channel
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload?: { userId?: string; typing?: boolean } }) => {
          const p = payload.payload;
          if (!p || p.userId === backendUserId) return;
          setOtherTyping(Boolean(p.typing));
          if (typingStopTimer.current) {
            window.clearTimeout(typingStopTimer.current);
          }
          if (p.typing) {
            typingStopTimer.current = window.setTimeout(() => {
              setOtherTyping(false);
            }, 3500);
          }
        },
      )
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      typingChannelRef.current = null;
      setOtherTyping(false);
      if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
      void sb.removeChannel(channel);
    };
  }, [id, backendUserId, chatClosed]);

  const broadcastTyping = useCallback(
    (typing: boolean) => {
      const ch = typingChannelRef.current;
      if (!ch || !backendUserId || chatClosed) return;
      const now = Date.now();
      // Throttle typing=true to ~1.2s
      if (typing && now - lastTypingSent.current < 1200) return;
      if (typing) lastTypingSent.current = now;
      void ch.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: backendUserId, typing },
      });
    },
    [backendUserId, chatClosed],
  );

  return { otherTyping, broadcastTyping };
}
