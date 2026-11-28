import "server-only";
import { isSuccessBody } from "@/lib/server/prembly-core";

/** Safe class for Care/UI — never holds NIN, image, or raw provider dumps. */
export type FaceFailReason =
  | "match_failed"
  | "capture_quality"
  | "low_confidence"
  | "provider_reject"
  | "nin_required"
  | "not_configured"
  | "network";

/** Prembly may nest face_data under data or data.nin_data. */
export function readFaceData(
  json: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const data = json.data as Record<string, unknown> | undefined;
  const ninData = data?.nin_data as Record<string, unknown> | undefined;
  for (const candidate of [json.face_data, data?.face_data, ninData?.face_data]) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }
  return undefined;
}

/** Normalise provider confidence to 0–100 when possible. */
export function normalizeConfidence(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  // Some channels return 0–1 fractions; nin_w_face samples are 0–100.
  if (n > 0 && n <= 1) return Math.round(n * 1000) / 10;
  if (n <= 100) return n;
  return null;
}

export function readConfidence(json: Record<string, unknown>): number | null {
  const face = readFaceData(json);
  const data = json.data as Record<string, unknown> | undefined;
  for (const v of [face?.confidence, json.confidence, data?.confidence]) {
    const n = normalizeConfidence(v);
    if (n != null) return n;
  }
  return null;
}

function providerText(json: Record<string, unknown>): string {
  const face = readFaceData(json);
  const data = json.data as Record<string, unknown> | undefined;
  const parts = [
    face?.message,
    json.detail,
    json.message,
    data?.detail,
    data?.message,
  ];
  return parts
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

export function failMessage(json: Record<string, unknown>, status: number): string {
  const face = readFaceData(json);
  const data = json.data as Record<string, unknown> | undefined;
  const msg =
    (face?.message as string) ||
    (json.detail as string) ||
    (json.message as string) ||
    (data?.detail as string) ||
    (data?.message as string) ||
    "";
  return msg || `Face verification failed (${status}).`;
}

/**
 * Classify a Prembly rejection into a safe reason for UI/audit.
 * Prefer face_data and HTTP status over free-text; text is a secondary signal.
 */
export function classifyFaceFailure(input: {
  json: Record<string, unknown>;
  httpStatus: number;
  confidence: number | null;
  minConfidence: number;
}): FaceFailReason {
  const { json, httpStatus, confidence, minConfidence } = input;
  const face = readFaceData(json);
  const text = providerText(json);

  if (
    httpStatus === 400 ||
    httpStatus === 422 ||
    /\b(no face|face not (found|detected)|unreadable|invalid image|malformed|image problem)\b/.test(
      text,
    )
  ) {
    return "capture_quality";
  }

  if (
    face?.status === false ||
    face?.response_code === "01" ||
    /\b(no match|does not match|face mismatch|not a match|face match failed)\b/.test(
      text,
    )
  ) {
    return "match_failed";
  }

  if (
    isSuccessBody(json) &&
    confidence != null &&
    confidence < minConfidence
  ) {
    return "low_confidence";
  }

  return "provider_reject";
}

/** User-facing copy for a classified provider rejection (422 path). */
export function userMessageForFaceFail(reason: FaceFailReason): string {
  switch (reason) {
    case "match_failed":
      return "Your face did not match the NIN photo on file. Confirm your NIN details and try again.";
    case "low_confidence":
      return "We could not confirm a clear match. Hold still, face the camera squarely, and try again.";
    case "capture_quality":
      return "We could not verify your face. Use good light, face the camera and try again.";
    case "nin_required":
      return "Add your NIN (Tier 2) before face verification.";
    case "not_configured":
    case "network":
      return "Face verification is not available right now. Please try again later.";
    default:
      return "We could not verify your face. Use good light, face the camera and try again.";
  }
}
