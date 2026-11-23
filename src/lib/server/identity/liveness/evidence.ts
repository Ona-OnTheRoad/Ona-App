import "server-only";
import { decryptField, isEncryptedPayload } from "@/lib/server/modules/crypto-fields";
import type { FaceCheckResult } from "./face-check";

/** Decoded selfie bounds: big enough to be a face, small enough for a row. */
export const SELFIE_MIN_BYTES = 2_000;
export const SELFIE_MAX_BYTES = 1_000_000;

const SELFIE_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export type ParsedSelfie = { dataUrl: string; base64: string; bytes: number };

/** Accept only a base64 JPEG/PNG/WebP data URL within the size bounds. */
export function parseSelfie(value: unknown): ParsedSelfie | null {
  if (typeof value !== "string") return null;
  // Base64 is 4/3 of the bytes; reject oversize strings before matching.
  if (value.length > Math.ceil(SELFIE_MAX_BYTES * 1.4) + 64) return null;
  const m = value.match(SELFIE_RE);
  if (!m) return null;
  const base64 = m[2];
  const pad = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = (base64.length * 3) / 4 - pad;
  if (bytes < SELFIE_MIN_BYTES || bytes > SELFIE_MAX_BYTES) return null;
  return { dataUrl: value, base64, bytes };
}

/**
 * The Pro's 11-digit NIN, or null. `nin_encrypted` holds either a v1:
 * payload or, on older rows, the plain number.
 */
export function ninOnFile(row: { nin_encrypted?: string | null } | null): string | null {
  const raw = row?.nin_encrypted;
  if (!raw) return null;
  const plain = isEncryptedPayload(raw) ? decryptField(raw) : raw;
  const digits = (plain || "").replace(/\D/g, "");
  return digits.length === 11 ? digits : null;
}

export type LivenessMeta = {
  source: "server_provider";
  provider: string;
  mode: string;
  checkMode: string;
  reference: string | null;
  confidence: number | null;
  selfieBytes: number;
  verifiedAt: string;
};

/** Durable Care evidence. Never holds the NIN or the image. */
export function buildLivenessMeta(
  result: Extract<FaceCheckResult, { ok: true }>,
  selfieBytes: number,
  verifiedAt: string,
): LivenessMeta {
  return {
    source: "server_provider",
    provider: result.provider,
    mode: result.mode,
    checkMode: result.checkMode,
    reference: result.reference || null,
    confidence: result.confidence,
    selfieBytes,
    verifiedAt,
  };
}
