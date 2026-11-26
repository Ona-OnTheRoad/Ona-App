import "server-only";
/**
 * Server-side Prembly face check for Tier 3 liveness. The only thing that may
 * mark a Service Pro face_liveness_verified (see /api/liveness/verify).
 *
 * Modes (PREMBLY_FACE_MODE):
 * - "nin_face" (default): selfie compared with the NIN holder's photo.
 *   POST /verification/nin_w_face  { number, image }
 * - "liveness": image-only liveness check.
 *   POST /verification/biometrics/face/liveliness_check  { image }
 * PREMBLY_FACE_PATH overrides the path; PREMBLY_FACE_MIN_CONFIDENCE (0-100,
 * default 80) is applied when the provider reports a confidence.
 *
 * Without a key it fails closed in production (NOT_CONFIGURED); outside
 * production a labelled local stand-in passes so the flow can be exercised.
 */
import {
  digitsOnly,
  headers,
  ID_LOOKUP_NOT_CONFIGURED,
  isProviderOutage,
  isSuccessBody,
  premblyConfig,
} from "@/lib/server/prembly-core";

export type FaceCheckMode = "nin_face" | "liveness";

export type FaceCheckResult =
  | {
      ok: true;
      provider: "prembly" | "local";
      mode: "live" | "sandbox_format";
      checkMode: FaceCheckMode;
      reference: string;
      confidence: number | null;
    }
  | {
      ok: false;
      provider: "prembly" | "local";
      mode: "live" | "sandbox_format";
      checkMode: FaceCheckMode;
      message: string;
      code: string;
    };

const DEFAULT_PATHS: Record<FaceCheckMode, string> = {
  nin_face: "/verification/nin_w_face",
  liveness: "/verification/biometrics/face/liveliness_check",
};

export function faceCheckMode(): FaceCheckMode {
  return process.env.PREMBLY_FACE_MODE?.trim() === "liveness"
    ? "liveness"
    : "nin_face";
}

function minConfidence(): number {
  const raw = process.env.PREMBLY_FACE_MIN_CONFIDENCE?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 80;
}

function readConfidence(json: Record<string, unknown>): number | null {
  const face = json.face_data as Record<string, unknown> | undefined;
  const data = json.data as Record<string, unknown> | undefined;
  for (const v of [face?.confidence, json.confidence, data?.confidence]) {
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return null;
}

/** Provider said yes: success body, no explicit face mismatch, confidence ok. */
export function isFacePass(json: Record<string, unknown>): boolean {
  if (!isSuccessBody(json)) return false;
  const face = json.face_data as Record<string, unknown> | undefined;
  if (face && (face.status === false || face.response_code === "01")) {
    return false;
  }
  const confidence = readConfidence(json);
  return confidence == null || confidence >= minConfidence();
}

function failMessage(json: Record<string, unknown>, status: number): string {
  const face = json.face_data as Record<string, unknown> | undefined;
  const msg =
    (face?.message as string) ||
    (json.detail as string) ||
    (json.message as string) ||
    "";
  return msg || `Face verification failed (${status}).`;
}

/** The provider could not answer, as opposed to answering "no". */
export function isFaceCheckOutage(result: FaceCheckResult): boolean {
  if (result.ok) return false;
  return isProviderOutage({ ...result, ok: false });
}

/** `imageBase64` is the bare base64 body (no data: prefix). */
export async function verifyFaceWithPrembly(input: {
  imageBase64: string;
  nin?: string | null;
}): Promise<FaceCheckResult> {
  const checkMode = faceCheckMode();
  const nin = digitsOnly(input.nin || "");
  if (checkMode === "nin_face" && nin.length !== 11) {
    return {
      ok: false,
      provider: "local",
      mode: "sandbox_format",
      checkMode,
      message: "A verified NIN is needed before face verification.",
      code: "NIN_REQUIRED",
    };
  }

  const { apiKey, appId, baseUrl, configured } = premblyConfig();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        provider: "local",
        mode: "sandbox_format",
        checkMode,
        message: "Face verification is not available right now. Please try again later.",
        code: ID_LOOKUP_NOT_CONFIGURED,
      };
    }
    return {
      ok: true,
      provider: "local",
      mode: "sandbox_format",
      checkMode,
      reference: `local-face-${Date.now()}`,
      confidence: null,
    };
  }

  const path = process.env.PREMBLY_FACE_PATH?.trim() || DEFAULT_PATHS[checkMode];
  const body =
    checkMode === "nin_face"
      ? { number: nin, image: input.imageBase64 }
      : { image: input.imageBase64 };

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: headers(apiKey, appId),
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !isFacePass(json)) {
      return {
        ok: false,
        provider: "prembly",
        mode: "live",
        checkMode,
        message: failMessage(json, res.status),
        code: String(json.response_code ?? res.status),
      };
    }
    const verification = json.verification as Record<string, unknown> | undefined;
    return {
      ok: true,
      provider: "prembly",
      mode: "live",
      checkMode,
      reference: String(verification?.reference ?? json.reference ?? ""),
      confidence: readConfidence(json),
    };
  } catch {
    return {
      ok: false,
      provider: "prembly",
      mode: "live",
      checkMode,
      message: "Face verification network error.",
      code: "NETWORK",
    };
  }
}
