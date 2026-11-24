/**
 * Tier 3 face liveness: the ONLY path that may set face_liveness_verified.
 *
 * The client's challenge (blink/turn) is a UX gate; authority is the server's
 * Prembly face check on the captured selfie (see lib/server/identity/liveness).
 * A bare `passed: true` is never trusted. On provider success the selfie,
 * evidence (liveness_meta) and flags are written together, then visibility is
 * recomputed. Without Prembly in production it fails closed (503).
 */

import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { writePlatformAudit } from "@/lib/server/modules/platform-audit";
import { ID_LOOKUP_NOT_CONFIGURED } from "@/lib/server/prembly-core";
import {
  faceCheckMode,
  isFaceCheckOutage,
  verifyFaceWithPrembly,
} from "@/lib/server/identity/liveness/face-check";
import {
  buildLivenessMeta,
  ninOnFile,
  parseSelfie,
} from "@/lib/server/identity/liveness/evidence";
import { guardLivenessAttempt } from "@/lib/server/identity/liveness/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid().optional(),
  selfie: z.string().max(1_500_000).optional(),
  challenges: z.array(z.string().max(32)).max(12).optional(),
  durationMs: z.number().min(0).max(120_000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiFail("Invalid body", 400, "invalid_body");
  const b = parsed.data;
  if (b.userId && b.userId !== auth.userId) {
    return apiFail("Forbidden", 403, "forbidden");
  }
  const userId = auth.userId;

  const selfie = parseSelfie(b.selfie);
  if (!selfie) {
    return apiFail(
      "A clear selfie photo is required for face verification.",
      400,
      "selfie_required",
    );
  }

  const limited = await guardLivenessAttempt(req, userId);
  if (limited) return limited;

  if (!isSupabaseAdminConfigured()) {
    return apiFail("Verification is not available right now.", 503, "no_db");
  }
  const supabase = createServiceSupabase();

  const { data: pro } = await supabase
    .from("repair_pro_profiles")
    .select("user_id, nin_encrypted")
    .eq("user_id", userId)
    .maybeSingle();
  if (!pro) return apiFail("No Repair Pro profile for this account.", 404, "not_pro");

  const nin = faceCheckMode() === "nin_face" ? ninOnFile(pro) : null;
  if (faceCheckMode() === "nin_face" && !nin) {
    return apiFail(
      "Add your NIN (Tier 2) before face verification.",
      422,
      "nin_required",
    );
  }

  const result = await verifyFaceWithPrembly({ imageBase64: selfie.base64, nin });
  const attempt = {
    challenges: b.challenges ?? [],
    durationMs: b.durationMs ?? null,
    provider: result.provider,
    mode: result.mode,
    checkMode: result.checkMode,
  };

  if (!result.ok) {
    await writePlatformAudit({
      actorId: userId,
      actorRole: "repair_pro",
      action: "pro.liveness.failed",
      targetType: "repair_pro_profiles",
      targetId: userId,
      newValue: { ...attempt, code: result.code },
    }).catch(() => undefined);
    if (result.code === ID_LOOKUP_NOT_CONFIGURED) {
      return apiFail(result.message, 503, "liveness_unavailable");
    }
    if (isFaceCheckOutage(result)) {
      return apiFail("Face verification is busy. Please try again shortly.", 503, "liveness_unavailable");
    }
    return apiFail(
      "We could not verify your face. Use good light, face the camera and try again.",
      422,
      "liveness_failed",
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("repair_pro_profiles")
    .update({
      face_liveness_verified: true,
      face_liveness_at: now,
      liveness_passed_at: now,
      face_liveness_selfie_url: selfie.dataUrl,
      liveness_meta: buildLivenessMeta(result, selfie.bytes, now),
      updated_at: now,
    })
    .eq("user_id", userId);
  if (error) {
    console.error("[liveness/verify] write failed", error.code);
    return apiFail("Could not save verification. Please try again.", 500, "db_error");
  }

  try {
    const { recomputeProVisibility } = await import("@/lib/server/pro-visibility");
    await recomputeProVisibility(supabase, userId);
  } catch {
    /* non-fatal: the ladder recomputes on the next verification event */
  }

  await writePlatformAudit({
    actorId: userId,
    actorRole: "repair_pro",
    action: "pro.liveness.passed",
    targetType: "repair_pro_profiles",
    targetId: userId,
    newValue: { ...attempt, reference: result.reference || null },
  }).catch(() => undefined);

  return apiOk({ recorded: true, faceLivenessVerified: true, verifiedAt: now });
}
