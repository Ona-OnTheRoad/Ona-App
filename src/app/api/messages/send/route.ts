import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { insertNotification } from "@/lib/server/notifications";
import { serverLogger } from "@/lib/server/structured-logger";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(4000),
  senderName: z.string().optional(),
});

function previewFromBody(body: string): string {
  try {
    const parsed = JSON.parse(body) as { text?: string; voiceUrl?: string };
    if (parsed && typeof parsed === "object") {
      if (parsed.voiceUrl) return parsed.text ? `🎤 ${parsed.text}` : "🎤 Voice note";
      if (parsed.text) return String(parsed.text);
    }
  } catch {
    /* plain text body */
  }
  return body;
}

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
  const { conversationId, body, senderName } = parsed.data;
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
      let name = (senderName || "").trim();
      if (!name) {
        const { data: prof } = await sb
          .from("profiles")
          .select("full_name")
          .eq("id", senderId)
          .maybeSingle();
        name = String(prof?.full_name || "New message").trim() || "New message";
      }
      const preview = previewFromBody(body);
      const res = await insertNotification({
        userId: recipientId,
        category: "messages",
        priority: "high",
        title: name,
        body: String(preview || "New message").slice(0, 160),
        href: `/messages/${conversationId}`,
        actionType: "open_chat",
        actionPayload: { conversationId },
        groupKey: `msg-${conversationId}`,
        jobId: conv.request_id ? String(conv.request_id) : null,
        messageText: String(preview || "New message").slice(0, 200),
      });
      if ("error" in res) {
        serverLogger.warn(
          "messages.send.notify_failed",
          { operation: "messages.send", outcome: "notify_failed" },
          req,
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
