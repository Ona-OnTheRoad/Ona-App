import type { JobTrigger } from "@/lib/jobs/diagnostics/types";
import { getIncomingIdlePollMs } from "@/lib/jobs/adaptive-poll";
import type {
  JobSubscriptionState,
  JobSubscriptionStatusListener,
} from "@/lib/supabase/shared-job-subscriptions";

interface IncomingIdleHealthDeps {
  /** Re-arm the poll timer (cadence is re-read at arm time). */
  rearm: () => void;
  /** Run a poll right now (reconnect / back online). */
  poll: (trigger: JobTrigger) => void;
  isCancelled: () => boolean;
}

/**
 * Tracks realtime health for the incoming-request popup so the IDLE list poll
 * can slow down while the shared channel is `connected` and the browser is
 * online. `NEXT_PUBLIC_INCOMING_IDLE_POLL_ADAPTIVE=false` is the rollback
 * switch back to the fixed 3s idle poll.
 */
export function createIncomingIdleHealth({
  rearm,
  poll,
  isCancelled,
}: IncomingIdleHealthDeps) {
  let state: JobSubscriptionState = "connecting";
  let online = typeof navigator === "undefined" ? true : navigator.onLine;
  const adaptiveEnabled =
    process.env.NEXT_PUBLIC_INCOMING_IDLE_POLL_ADAPTIVE !== "false";

  const onSubStatus: JobSubscriptionStatusListener = (next, meta) => {
    const was = state;
    state = next;
    if (isCancelled() || was === next) return;
    rearm();
    if (next === "connected" && meta.reconnected) poll("realtime");
  };
  const onOnline = () => {
    online = true;
    rearm();
    poll("retry");
  };
  const onOffline = () => {
    online = false;
    rearm();
  };

  return {
    onSubStatus,
    isConnected: () => state === "connected",
    idleDelay: () =>
      getIncomingIdlePollMs({ subscriptionState: state, online, adaptiveEnabled }),
    /** Start listening for online/offline; returns the cleanup. */
    listen(): () => void {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    },
  };
}
