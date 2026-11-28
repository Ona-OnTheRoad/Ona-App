import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const mocks = vi.hoisted(() => ({
  service: vi.fn(),
  getUser: vi.fn(),
  face: vi.fn(),
  rateLimit: vi.fn(),
  audit: vi.fn(),
  recompute: vi.fn(),
}));
vi.mock("@/lib/server/auth-utils", () => ({ requireUser: mocks.getUser }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseUrl: () => "https://example.test",
  getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/identity/liveness/face-check", async (original) => ({
  ...(await original<typeof import("@/lib/server/identity/liveness/face-check")>()),
  verifyFaceWithPrembly: mocks.face,
}));
vi.mock("@/lib/server/modules/rate-limit", async (original) => ({
  ...(await original<typeof import("@/lib/server/modules/rate-limit")>()),
  rateLimitAsync: mocks.rateLimit,
}));
vi.mock("@/lib/server/modules/platform-audit", () => ({ writePlatformAudit: mocks.audit }));
vi.mock("@/lib/server/pro-visibility", () => ({ recomputeProVisibility: mocks.recompute }));

import { POST } from "../route";
import { RateLimitUnavailableError } from "@/lib/server/modules/rate-limit";

const NIN = "12345678901";
const SELFIE = `data:image/jpeg;base64,${Buffer.alloc(3_000, 7).toString("base64")}`;
const providerOk = {
  ok: true, provider: "prembly", mode: "live", checkMode: "nin_face",
  reference: "face-ref-1", confidence: 97,
};

function setup(pro: Row | null = { user_id: "user-1", nin_encrypted: NIN, face_liveness_verified: false }) {
  const sb = new FakeSupabase({ repair_pro_profiles: pro ? [pro] : [] });
  mocks.service.mockReturnValue(sb);
  return sb;
}
function post(body: Record<string, unknown>) {
  return POST(new Request("https://ona.test/api/liveness/verify", {
    method: "POST",
    body: JSON.stringify({ access_token: "valid-access-token", ...body }),
  }));
}
const flags = (sb: FakeSupabase) => {
  const r = sb.rows.repair_pro_profiles[0];
  return { v: r.face_liveness_verified, at: r.face_liveness_at, passed: r.liveness_passed_at };
};

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.PREMBLY_FACE_MODE;
  mocks.getUser.mockResolvedValue({ ok: true, userId: "user-1" });
  mocks.rateLimit.mockResolvedValue({ ok: true });
  mocks.audit.mockResolvedValue(undefined);
  mocks.recompute.mockResolvedValue({ tier: 3, changed: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/liveness/verify: client cannot self-attest", () => {
  it("rejects a bare passed:true with no selfie and writes nothing", async () => {
    const sb = setup();
    const res = await post({ passed: true, challenges: ["blink"], clientScore: 1 });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("selfie_required");
    expect(flags(sb).v).toBe(false);
    expect(mocks.face).not.toHaveBeenCalled();
    expect(mocks.recompute).not.toHaveBeenCalled();
  });

  it("rejects a non-image or oversized selfie", async () => {
    setup();
    for (const selfie of ["data:text/html;base64,PHNjcmlwdD4=", "data:image/jpeg;base64,AAAA"]) {
      const res = await post({ selfie });
      expect(res.status).toBe(400);
    }
    expect(mocks.face).not.toHaveBeenCalled();
  });

  it("forbids verifying another user's id", async () => {
    setup();
    const res = await post({ selfie: SELFIE, userId: "00000000-0000-4000-8000-000000000009" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/liveness/verify: provider gate", () => {
  it("sets Tier 3, stores selfie and evidence, then recomputes visibility on provider ok", async () => {
    const sb = setup();
    mocks.face.mockResolvedValue(providerOk);
    const res = await post({ selfie: SELFIE, challenges: ["blink", "turn_left"], durationMs: 9000 });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ recorded: true, faceLivenessVerified: true });
    expect(mocks.face).toHaveBeenCalledWith({ imageBase64: SELFIE.split(",")[1], nin: NIN });
    const row = sb.rows.repair_pro_profiles[0];
    expect(row.face_liveness_verified).toBe(true);
    expect(row.face_liveness_selfie_url).toBe(SELFIE);
    expect(row.liveness_meta).toMatchObject({
      source: "server_provider", provider: "prembly", mode: "live",
      checkMode: "nin_face", reference: "face-ref-1", confidence: 97, selfieBytes: 3_000,
    });
    expect(JSON.stringify(row.liveness_meta)).not.toContain(NIN);
    expect(mocks.recompute).toHaveBeenCalledWith(sb, "user-1");
    const audit = JSON.stringify(mocks.audit.mock.calls);
    expect(audit).not.toContain(NIN);
    expect(audit).not.toContain(SELFIE.split(",")[1].slice(0, 40));
  });

  it("returns 422 with NIN-mismatch copy and audits reason when the provider rejects the face", async () => {
    const sb = setup();
    mocks.face.mockResolvedValue({
      ok: false,
      provider: "prembly",
      mode: "live",
      checkMode: "nin_face",
      message: "No Match",
      code: "01",
      reason: "match_failed",
      confidence: 18,
    });
    const res = await post({ selfie: SELFIE });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("liveness_failed");
    expect(body.error.message).toMatch(/NIN photo/i);
    expect(flags(sb)).toEqual({ v: false, at: undefined, passed: undefined });
    expect(mocks.recompute).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "pro.liveness.failed",
        newValue: expect.objectContaining({
          code: "01",
          reason: "match_failed",
          confidence: 18,
        }),
      }),
    );
    const audit = JSON.stringify(mocks.audit.mock.calls);
    expect(audit).not.toContain(NIN);
    expect(audit).not.toContain(SELFIE.split(",")[1].slice(0, 40));
  });

  it("keeps the capture tip for capture_quality rejects", async () => {
    setup();
    mocks.face.mockResolvedValue({
      ok: false,
      provider: "prembly",
      mode: "live",
      checkMode: "nin_face",
      message: "No face detected",
      code: "422",
      reason: "capture_quality",
      confidence: null,
    });
    const res = await post({ selfie: SELFIE });
    expect(res.status).toBe(422);
    expect((await res.json()).error.message).toMatch(/good light/i);
  });

  it("fails closed with 503 when the provider is not configured", async () => {
    const sb = setup();
    mocks.face.mockResolvedValue({
      ok: false, provider: "local", mode: "sandbox_format", checkMode: "nin_face",
      message: "Face verification is not available right now.", code: "NOT_CONFIGURED",
    });
    const res = await post({ selfie: SELFIE });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("liveness_unavailable");
    expect(flags(sb).v).toBe(false);
  });

  it("returns 503 (not a rejection) on a provider outage", async () => {
    setup();
    mocks.face.mockResolvedValue({
      ok: false, provider: "prembly", mode: "live", checkMode: "nin_face", message: "x", code: "NETWORK",
    });
    expect((await post({ selfie: SELFIE })).status).toBe(503);
  });

  it("requires an 11-digit NIN on file in nin_face mode and makes no provider call", async () => {
    setup({ user_id: "user-1", nin_encrypted: "A1234567", face_liveness_verified: false });
    const res = await post({ selfie: SELFIE });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("nin_required");
    expect(mocks.face).not.toHaveBeenCalled();
  });

  it("does not need a NIN in liveness mode", async () => {
    process.env.PREMBLY_FACE_MODE = "liveness";
    setup({ user_id: "user-1", nin_encrypted: null, face_liveness_verified: false });
    mocks.face.mockResolvedValue({ ...providerOk, checkMode: "liveness" });
    expect((await post({ selfie: SELFIE })).status).toBe(200);
    expect(mocks.face).toHaveBeenCalledWith({ imageBase64: expect.any(String), nin: null });
  });

  it("returns 404 for an account with no Service Pro profile", async () => {
    setup(null);
    expect((await post({ selfie: SELFIE })).status).toBe(404);
    expect(mocks.face).not.toHaveBeenCalled();
  });
});

describe("POST /api/liveness/verify: attempt budget", () => {
  it("returns 429 with Retry-After when the budget is spent", async () => {
    setup();
    mocks.rateLimit.mockResolvedValue({ ok: false, retryAfterSec: 1502 });
    const res = await post({ selfie: SELFIE });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("1502");
    const body = await res.json();
    expect(body.error.message).toBe("Too many verification attempts. Try again in about 26 minutes.");
    expect(mocks.face).not.toHaveBeenCalled();
  });

  it("checks both a per-user and a per-IP key", async () => {
    setup();
    mocks.face.mockResolvedValue(providerOk);
    await post({ selfie: SELFIE });
    const keys = mocks.rateLimit.mock.calls.map(([o]) => o.key);
    expect(keys).toEqual([expect.stringMatching(/^liveness:user:user-1$/), expect.stringMatching(/^liveness:ip:/)]);
  });

  it("fails closed with 503 when the limiter is unavailable", async () => {
    setup();
    mocks.rateLimit.mockRejectedValue(new RateLimitUnavailableError());
    const res = await post({ selfie: SELFIE });
    expect(res.status).toBe(503);
    expect(mocks.face).not.toHaveBeenCalled();
  });
});
