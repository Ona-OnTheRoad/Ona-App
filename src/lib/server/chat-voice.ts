import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const CHAT_VOICE_BUCKET = "chat-voice";
/** Matches the bucket's file_size_limit (3 MB); well under the 4.5 MB request cap. */
export const CHAT_VOICE_MAX_BYTES = 3 * 1024 * 1024;
/** Signed URLs are re-issued on every conversations fetch, so this only has to outlive a stale screen. */
export const CHAT_VOICE_URL_TTL_SEC = 6 * 60 * 60;

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
};

/** "audio/webm;codecs=opus" -> "audio/webm"; null when it is not an allowed audio type. */
export function normalizeVoiceMime(raw: string | null | undefined): string | null {
  const base = String(raw || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return base in EXT_BY_MIME ? base : null;
}

export function voiceExtForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? "webm";
}

/** Keys are `<conversation>/<sender>/<file>`; a sender may only attach their own uploads. */
export function voiceKeyBelongsTo(
  key: string,
  conversationId: string,
  senderId: string,
): boolean {
  if (key.includes("..") || key.includes("//")) return false;
  const parts = key.split("/");
  return (
    parts.length === 3 &&
    parts[0] === conversationId &&
    parts[1] === senderId &&
    parts[2].length > 0
  );
}

/** What gets stored in messages.body for a voice note (a small pointer, never the audio). */
export function buildVoiceBody(input: {
  text?: string;
  key: string;
  durationSec?: number | null;
  mime: string;
}): string {
  return JSON.stringify({
    text: (input.text || "").trim() || "Voice note",
    voiceKey: input.key,
    voiceDurationSec: input.durationSec ?? null,
    voiceMime: input.mime,
  });
}

/** Short text for notifications / push: plain text, or a microphone line for voice. */
export function previewFromBody(body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      text?: string;
      voiceKey?: string;
      voiceUrl?: string;
    };
    if (parsed && typeof parsed === "object") {
      if (parsed.voiceKey || parsed.voiceUrl) {
        const text = (parsed.text || "").trim();
        return text && text !== "Voice note" ? `🎤 ${text}` : "🎤 Voice note";
      }
      if (parsed.text) return String(parsed.text);
    }
  } catch {
    /* plain text body */
  }
  return body;
}

/** key -> signed URL for every key that could be signed. Failures just leave a key out. */
export async function signVoiceKeys(
  sb: SupabaseClient,
  keys: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(keys)];
  if (!unique.length) return out;
  const { data, error } = await sb.storage
    .from(CHAT_VOICE_BUCKET)
    .createSignedUrls(unique, CHAT_VOICE_URL_TTL_SEC);
  if (error || !data) return out;
  for (const row of data) {
    if (row.path && row.signedUrl && !row.error) out.set(row.path, row.signedUrl);
  }
  return out;
}
