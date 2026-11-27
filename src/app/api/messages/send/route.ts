import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import {
  buildVoiceBody,
  normalizeVoiceMime,
  previewFromBody,
  voiceKeyBelongsTo,
} from "@/lib/server/chat-voice";
import { insertNotification } from "@/lib/server/notifications";
import { sendPushToUser } from "@/lib/server/push/webpush";
import { serverLogger } from "@/lib/server/structured-logger";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    conversationId: z.string().min(1),
    /** Plain text, or the caption of a voice note. */
    body: z.string().max(4000).optional(),
    /** A voice note already uploaded through /api/messages/voice. */
    voice: z
      .object({
        key: z.string().min(1).max(300),
        durationSec: z.number().min(0).max(3600).nullish(),
        mime: z.string().min(1).max(100),
      })
      .optional(),
    // Any client-supplied display name is ignored (see the notification block):
    // the sender's name always comes from their profile.
  })
  .refine((v) => Boolean(v.voice) || Boolean(v.body && v.body.length > 0), {
    message: "Message is empty",
  });

/**
 * Send a chat message. Replaces the browser's direct messages insert +
 * conversations update — this route uses the service-role client, which
 * bypasses RLS, so conversation membership is checked explicitly below
 * instead of relying on the database policy that gated the direct write.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiFail("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiFail("Invalid request", 400);
  const { conversationId, body: rawBody, voice } = parsed.data;
  const senderId = auth.userId;

  const sb = createServiceSupabase();

  const { data: conv, error: convError } = await sb
    .from("conversations")
    .select("id, motorist_id, repair_pro_id, request_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (convError) return apiFail(convError.message, 500);
  if (!conv) return apiFail("Conversation not found", 404);

  const motoristId = String(conv.motorist_id || "");
  const proId = String(conv.repair_pro_id || "");
  if (senderId !== motoristId && senderId !== proId) {
    return apiFail("Forbidden", 403, "forbidden");
  }

  let body = rawBody || "";
  if (voice) {
    const mime = normalizeVoiceMime(voice.mime);
    if (!mime) return apiFail("Unsupported audio format", 400);
    // Only the sender's own upload in this conversation can be attached.
    if (!voiceKeyBelongsTo(voice.key, conversationId, senderId)) {
      return apiFail("Invalid voice note", 400);
    }
    body = buildVoiceBody({
      text: rawBody,
      key: voice.key,
      durationSec: voice.durationSec,
      mime,
    });
  }

  const nowIso = new Date().toISOString();
  const { data: message, error: insertError } = await sb
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("id, created_at")
    .single();
  if (insertError || !message) {
    return apiFail(insertError?.message || "Message not sent", 500);
  }

  // Best-effort below: the message is already delivered. A failure here
  // means a stale conversation preview or a missed toast, not a lost
  // message — log it instead of failing a request that already succeeded.
  const { error: updateError } = await sb
    .from("conversations")
    .update({ last_message_at: nowIso })
    .eq("id", conversationId);
  if (updateError) {
    serverLogger.warn(
      "messages.send.conversation_timestamp_failed",
      { operation: "messages.send", outcome: "conversation_update_failed" },
      req,
      updateError,
    );
  }

  const recipientId = senderId === motoristId ? proId : motoristId;
  if (recipientId && recipientId !== senderId) {
    try {
      // Always the sender's own profile name, never a client-supplied one, so a
      // modified app cannot send a message that shows up under someone else's name.
      const { data: prof } = await sb
        .from("profiles")
        .select("full_name")
        .eq("id", senderId)
        .maybeSingle();
      const name =
        String(prof?.full_name || "New message").trim() || "New message";
      const preview = previewFromBody(body);
      const title = name;
      const notifBody = String(preview || "New message").slice(0, 160);
      const href = `/messages/${conversationId}`;
      const res = await insertNotification({
        userId: recipientId,
        category: "messages",
        priority: "high",
        title,
        body: notifBody,
        href,
        actionType: "open_chat",
        actionPayload: { conversationId },
        // Per-message key: conversation-only keys made insertNotification
        // skip forever after the first chat alert for that thread.
        groupKey: `msg-${conversationId}-${message.id}`,
        jobId: conv.request_id ? String(conv.request_id) : null,
        messageText: String(preview || "New message").slice(0, 200),
        push: false, // sent below with a per-conversation tag
      });
      if ("error" in res) {
        serverLogger.warn(
          "messages.send.notify_failed",
          { operation: "messages.send", outcome: "notify_failed" },
          req,
        );
      }
      // Always attempt OS push (prefs gated inside sendPushToUser).
      // tag collapses the tray to one item per conversation.
      try {
        await sendPushToUser(recipientId, {
          title,
          body: notifBody,
          url: href,
          tag: `msg-${conversationId}`,
          category: "messages",
          priority: "high",
        });
      } catch (pushErr) {
        serverLogger.warn(
          "messages.send.push_failed",
          { operation: "messages.send", outcome: "push_threw" },
          req,
          pushErr,
        );
      }
    } catch (e) {
      serverLogger.warn(
        "messages.send.notify_failed",
        { operation: "messages.send", outcome: "notify_threw" },
        req,
        e,
      );
    }
  }

  return apiOk({ id: message.id, createdAt: message.created_at });
}
