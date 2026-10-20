"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { recordJobDiagnostic } from "@/lib/jobs/diagnostics/collector";
import type { JobSource, Outcome } from "@/lib/jobs/diagnostics/types";

type JobChange = { new?: Record<string, unknown>; old?: Record<string, unknown> };
export type JobChangeListener = (payload?: JobChange) => void;
export type JobSubscriptionState = "connecting" | "connected" | "reconnecting" | "failed";
export type JobSubscriptionStatusListener = (
  state: JobSubscriptionState,
  meta: { reconnected: boolean; hadPriorConnection: boolean },
) => void;
type Consumer = {
  onChange: JobChangeListener;
  source: JobSource;
  onStatusChange?: JobSubscriptionStatusListener;
};
type Entry = {
  channel: RealtimeChannel;
  listeners: Set<Consumer>;
  active: boolean;
  state: JobSubscriptionState;
  hadConnected: boolean;
};

// Client identity prevents a replacement client's listeners sharing an old connection.
// Entries hold no snapshots; the final unsubscribe removes the user key immediately.
const clients = new WeakMap<SupabaseClient, Map<string, Entry>>();
const channelContext = { source: "shared-jobs", trigger: "realtime" } as const;
const statusOutcomes: Record<string, Outcome> = {
  SUBSCRIBED: "subscribed", CHANNEL_ERROR: "channel-error",
  TIMED_OUT: "timeout", CLOSED: "closed",
};

function mapChannelStatus(
  rawStatus: string,
  hadConnected: boolean,
): JobSubscriptionState | null {
  if (rawStatus === "SUBSCRIBED") return "connected";
  if (rawStatus === "TIMED_OUT" || rawStatus === "CLOSED") {
    return hadConnected ? "reconnecting" : "failed";
  }
  if (rawStatus === "CHANNEL_ERROR") {
    return hadConnected ? "reconnecting" : "failed";
  }
  return null;
}

function consumerEvent(consumer: Consumer, outcome: Outcome) {
  recordJobDiagnostic("subscription-consumer", "jobs", {
    source: consumer.source, trigger: "realtime",
  }, outcome);
}

function notifyConsumerStatus(
  consumer: Consumer,
  state: JobSubscriptionState,
  meta: { reconnected: boolean; hadPriorConnection: boolean },
) {
  if (!consumer.onStatusChange) return;
  try {
    consumer.onStatusChange(state, meta);
  } catch {
    consumerEvent(consumer, "error");
  }
}

function dispose(client: SupabaseClient, entries: Map<string, Entry>, userId: string, entry: Entry) {
  entry.active = false;
  entry.listeners.clear();
  if (entries.get(userId) === entry) entries.delete(userId);
  recordJobDiagnostic("subscription", "jobs", channelContext, "removed");
  // Unsubscribe is fire-and-forget, but SDK rejection must not become unhandled.
  try {
    void Promise.resolve(client.removeChannel(entry.channel)).catch(() => {
      recordJobDiagnostic("subscription", "jobs", channelContext, "error");
    });
  } catch {
    recordJobDiagnostic("subscription", "jobs", channelContext, "error");
  }
}

/** One channel per client/user in this tab; authorization remains Supabase RLS. */
export function subscribeSharedJobRows(
  client: SupabaseClient | null,
  userId: string,
  onChange: JobChangeListener,
  source: JobSource,
  onStatusChange?: JobSubscriptionStatusListener,
): (() => void) | null {
  const consumer: Consumer = { onChange, source, onStatusChange };
  if (!client || typeof window === "undefined") {
    consumerEvent(consumer, "unavailable");
    return null;
  }
  let entries = clients.get(client);
  if (!entries) { entries = new Map(); clients.set(client, entries); }
  let entry = entries.get(userId);
  if (entry) {
    entry.listeners.add(consumer);
    consumerEvent(consumer, "opened");
    if (entry.state !== "connecting") {
      notifyConsumerStatus(consumer, entry.state, {
        reconnected: false,
        hadPriorConnection: entry.hadConnected,
      });
    }
  } else {
    entry = {
      channel: client.channel(`jobs:${userId}:${Math.random().toString(36).slice(2, 8)}`),
      listeners: new Set([consumer]),
      active: true,
      state: "connecting",
      hadConnected: false,
    };
    const openedEntry = entry;
    entries.set(userId, openedEntry);
    recordJobDiagnostic("subscription", "jobs", channelContext, "opened");
    consumerEvent(consumer, "opened");
    const deliver = (payload: JobChange | null) => {
      if (!openedEntry.active) return;
      recordJobDiagnostic("subscription", "jobs", channelContext, "event");
      // Snapshot membership so listeners added during delivery wait for the next event.
      for (const listener of [...openedEntry.listeners]) {
        if (!openedEntry.active || !openedEntry.listeners.has(listener)) continue;
        consumerEvent(listener, "event");
        try { listener.onChange(payload || undefined); }
        catch { consumerEvent(listener, "error"); }
      }
    };
    try {
      openedEntry.channel
        .on("postgres_changes", {
          event: "*", schema: "public", table: "service_requests",
          filter: `motorist_id=eq.${userId}`,
        }, deliver)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "service_requests",
          filter: `repair_pro_id=eq.${userId}`,
        }, deliver)
        .subscribe((status) => {
          if (!openedEntry.active) return;
          const outcome = statusOutcomes[status];
          if (outcome) recordJobDiagnostic("subscription", "jobs", channelContext, outcome);
          const nextState = mapChannelStatus(status, openedEntry.hadConnected);
          if (!nextState) return;
          const prevState = openedEntry.state;
          const hadPrior = openedEntry.hadConnected;
          const reconnected =
            nextState === "connected" &&
            hadPrior &&
            prevState !== "connected";
          if (nextState === "connected") {
            openedEntry.hadConnected = true;
          }
          openedEntry.state = nextState;
          for (const listener of [...openedEntry.listeners]) {
            if (!openedEntry.active || !openedEntry.listeners.has(listener)) continue;
            notifyConsumerStatus(listener, nextState, {
              reconnected,
              hadPriorConnection: hadPrior,
            });
          }
        });
    } catch (error) {
      dispose(client, entries, userId, openedEntry);
      throw error;
    }
  }
  const ownedEntry = entry;
  const ownedEntries = entries;
  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    ownedEntry.listeners.delete(consumer);
    consumerEvent(consumer, "removed");
    if (ownedEntry.listeners.size === 0) dispose(client, ownedEntries, userId, ownedEntry);
  };
}
