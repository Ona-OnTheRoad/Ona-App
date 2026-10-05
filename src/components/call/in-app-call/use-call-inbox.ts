import { useEffect } from "react";
import { ensureNotifyPermission } from "@/lib/app-notify";
import {
  ackCallSignals,
  pollCallSignals,
  type CallSignalRow,
} from "@/lib/call-signal";
import { unlockAudio } from "@/lib/sound-tone";
import { getAppSupabase } from "@/lib/supabase/app-client";
import { isUuid } from "./helpers";

/** Polls the durable signal inbox + Realtime INSERT wake-ups, and unlocks audio on first gesture. */
export function useCallInbox(
  backendUserId: string | null | undefined,
  processSignal: (row: CallSignalRow) => Promise<void>,
) {
  // Poll durable signal inbox + Realtime (works on every screen)
  useEffect(() => {
    if (!backendUserId || !isUuid(backendUserId)) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const rows = await pollCallSignals(backendUserId);
      if (!rows.length || cancelled) return;
      const acked: string[] = [];
      for (const r of rows) {
        try {
          await processSignal(r);
          acked.push(r.id);
        } catch (e) {
          console.warn("processSignal", e);
        }
      }
      if (acked.length) void ackCallSignals(acked);
    };

    void tick();
    // Realtime INSERT wakes us; rare poll backs up (was 8s and noisy on data).
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void tick();
    }, 15_000);

    const onVis = () => {
      void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    window.addEventListener("pageshow", onVis);

    const sb = getAppSupabase();
    let channel: ReturnType<NonNullable<typeof sb>["channel"]> | null = null;
    if (sb) {
      channel = sb
        .channel(
          `call-db:${backendUserId}-${Math.random().toString(36).slice(2, 8)}`,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_signals",
            filter: `to_user_id=eq.${backendUserId}`,
          },
          () => {
            void tick();
          },
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      window.removeEventListener("pageshow", onVis);
      if (sb && channel) void sb.removeChannel(channel);
    };
  }, [backendUserId, processSignal]);

  // Unlock audio on first user gesture so ring plays without being on call screen
  useEffect(() => {
    const once = () => {
      unlockAudio();
      void ensureNotifyPermission();
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("touchstart", once);
    };
    window.addEventListener("pointerdown", once, { passive: true });
    window.addEventListener("touchstart", once, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("touchstart", once);
    };
  }, []);
}
