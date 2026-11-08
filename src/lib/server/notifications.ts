import "server-only";
/**
 * Server-side notification writes (service role).
 */

import { createServiceSupabase } from "@/lib/supabase/server";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationActionType,
} from "@/lib/notifications/types";

export type CreateNotificationInput = {
  userId: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  href?: string | null;
  actionType?: NotificationActionType;
  actionPayload?: Record<string, unknown>;
  groupKey?: string | null;
  jobId?: string | null;
  jobStatus?: string | null;
  messageText?: string | null;
  /**
   * Also deliver as an OS push (reaches the phone with the app closed).
   * Default: on for "high" and "critical" priority. Pass false when the caller
   * sends its own push.
   */
  push?: boolean;
  /**
   * Time-critical offer (a new request a pro must answer within seconds):
   * short TTL, high urgency, stays on screen until acted on.
   */
  pushUrgent?: boolean;
};

const PUSH_PRIORITIES = new Set(["high", "critical"]);

/** Never throws and never waits long: a notification must not stall the caller. */
async function pushForNotification(input: CreateNotificationInput) {
  if (input.push === false) return;
  if (!PUSH_PRIORITIES.has(input.priority || "normal")) return;
  try {
    const { sendPushToUser } = await import("@/lib/server/push/webpush");
    const critical = input.priority === "critical";
    const send = sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      url: input.href || "/",
      tag: input.groupKey || `${input.category}-${input.jobId ?? input.title}`,
      category: input.category,
      priority: input.priority,
      ttl: input.pushUrgent ? 120 : critical ? 6 * 60 * 60 : 15 * 60,
      urgency: input.pushUrgent || critical ? "high" : "normal",
      requireInteraction: Boolean(input.pushUrgent),
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        send,
        new Promise((resolve) => {
          timer = setTimeout(resolve, 6000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    /* push is best-effort */
  }
}

export async function insertNotification(
  input: CreateNotificationInput,
): Promise<{ id: string } | { error: string; skipped?: boolean }> {
  try {
    const sb = createServiceSupabase();

    // Dedupe: same user + group_key → never spam (e.g. payout-released-*)
    if (input.groupKey) {
      const { data: existing } = await sb
        .from("notifications")
        .select("id")
        .eq("user_id", input.userId)
        .eq("group_key", input.groupKey)
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        return { id: String(existing.id), skipped: true };
      }
    }

    const { data, error } = await sb
      .from("notifications")
      .insert({
        user_id: input.userId,
        category: input.category,
        priority: input.priority || "normal",
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        action_type: input.actionType ?? null,
        action_payload: input.actionPayload ?? {},
        group_key: input.groupKey ?? null,
        job_id: input.jobId ?? null,
        job_status: input.jobStatus ?? null,
        message_text: input.messageText ?? null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    // Only a freshly inserted row pushes: a deduped repeat returned above.
    await pushForNotification(input);
    return { id: data.id as string };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "notification_insert_failed",
    };
  }
}

/**
 * Mark all unread notifications for a user matching a groupKey prefix as read.
 * Used to auto-dismiss superseded notifications (e.g. close "Confirm job" when payout released).
 */
export async function markNotificationsByGroupKey(
  userId: string,
  groupKeyPrefix: string,
): Promise<void> {
  try {
    const sb = createServiceSupabase();
    const now = new Date().toISOString();
    await sb
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .like("group_key", `${groupKeyPrefix}%`)
      .is("read_at", null);
  } catch {
    /* best-effort */
  }
}

export function mapNotificationRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    category: row.category as NotificationCategory,
    priority: (row.priority as NotificationPriority) || "normal",
    title: String(row.title || ""),
    body: String(row.body || ""),
    href: (row.href as string) || null,
    actionType: (row.action_type as NotificationActionType) || null,
    actionPayload: (row.action_payload as Record<string, unknown>) || {},
    groupKey: (row.group_key as string) || null,
    jobId: (row.job_id as string) || null,
    jobStatus: (row.job_status as string) || null,
    messageText: (row.message_text as string) || null,
    readAt: (row.read_at as string) || null,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}
