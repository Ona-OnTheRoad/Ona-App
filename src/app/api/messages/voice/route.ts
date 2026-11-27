import { randomUUID } from "crypto";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import {
  CHAT_VOICE_BUCKET,
  CHAT_VOICE_MAX_BYTES,
  normalizeVoiceMime,
  voiceExtForMime,
} from "@/lib/server/chat-voice";
import { serverLogger } from "@/lib/server/structured-logger";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upload one chat voice note.
 *
 * Raw audio bytes in the body, `Content-Type` = the recording's audio type,
 * `?conversationId=` in the query. Returns the storage key; the client then
 * sends it through /api/messages/send as `voice`. Only the two members of the
 * conversation may upload, and the file lands under their own user id.
 */
export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const conversationId = new URL(req.url).searchParams.get("conversationId") || "";
  if (!conversationId) return apiFail("conversationId required", 400);

  const mime = normalizeVoiceMime(req.headers.get("content-type"));
  if (!mime) return apiFail("Unsupported audio format", 415);

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > CHAT_VOICE_MAX_BYTES) {
    return apiFail("Voice note too large", 413);
  }

  const sb = createServiceSupabase();
  const { data: conv, error: convError } = await sb
    .from("conversations")
    .select("id, motorist_id, repair_pro_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (convError) return apiFail(convError.message, 500);
  if (!conv) return apiFail("Conversation not found", 404);
  if (auth.userId !== conv.motorist_id && auth.userId !== conv.repair_pro_id) {
    return apiFail("Forbidden", 403, "forbidden");
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await req.arrayBuffer();
  } catch {
    return apiFail("Could not read audio", 400);
  }
  if (bytes.byteLength === 0) return apiFail("Empty voice note", 400);
  if (bytes.byteLength > CHAT_VOICE_MAX_BYTES) {
    return apiFail("Voice note too large", 413);
  }

  const key = `${conversationId}/${auth.userId}/${randomUUID()}.${voiceExtForMime(mime)}`;
  const { error: uploadError } = await sb.storage
    .from(CHAT_VOICE_BUCKET)
    .upload(key, Buffer.from(bytes), {
      contentType: mime,
      cacheControl: "private, max-age=3600",
      upsert: false,
    });
  if (uploadError) {
    serverLogger.warn(
      "messages.voice.upload_failed",
      { operation: "messages.voice", outcome: "upload_failed" },
      req,
      uploadError,
    );
    return apiFail("Could not upload voice note. Try again.", 500);
  }

  return apiOk({ key, mime });
}
