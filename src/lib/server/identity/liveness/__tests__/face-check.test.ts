import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifyFaceFailure,
  isFacePass,
  normalizeConfidence,
  readConfidence,
  readFaceData,
  userMessageForFaceFail,
  verifyFaceWithPrembly,
} from "../face-check";
import { buildLivenessMeta, ninOnFile, parseSelfie } from "../evidence";
import { encryptField } from "@/lib/server/modules/crypto-fields";

const NIN = "12345678901";
const IMG = Buffer.alloc(3_000, 1).toString("base64");

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("PREMBLY_API_KEY", "test-key");
  vi.stubEnv("PREMBLY_FACE_MODE", "");
  vi.stubEnv("PREMBLY_FACE_PATH", "");
  vi.stubEnv("PREMBLY_FACE_MIN_CONFIDENCE", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const reply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));

describe("verifyFaceWithPrembly", () => {
  it("posts NIN + image to nin_w_face and returns the reference on success", async () => {
    reply(200, { status: true, verification: { reference: "r-1" }, face_data: { status: true, confidence: 95 } });
    const r = await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN });
    expect(r).toMatchObject({ ok: true, provider: "prembly", mode: "live", reference: "r-1", confidence: 95 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/verification\/nin_w_face$/);
    expect(JSON.parse(init.body)).toEqual({ number: NIN, image: IMG });
  });

  it("rejects a face mismatch or low confidence even with a success envelope", async () => {
    reply(200, { status: true, face_data: { status: false, message: "Face does not match" } });
    expect(await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN })).toMatchObject({
      ok: false,
      reason: "match_failed",
      message: "Face does not match",
    });
    reply(200, { status: true, face_data: { status: true, confidence: 40 } });
    expect(await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN })).toMatchObject({
      ok: false,
      reason: "low_confidence",
      confidence: 40,
    });
  });

  it("reads nested data.face_data from the documented Prembly envelope", async () => {
    reply(200, {
      status: true,
      response_code: "00",
      data: {
        status: true,
        face_data: { status: true, confidence: 99.98, message: "Face Match" },
      },
    });
    expect(await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN })).toMatchObject({
      ok: true,
      confidence: 99.98,
    });
  });

  it("classifies nested face mismatch and capture errors", async () => {
    reply(200, {
      status: true,
      data: { face_data: { status: false, message: "No Match", confidence: 12 } },
    });
    expect(await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN })).toMatchObject({
      ok: false,
      reason: "match_failed",
      confidence: 12,
    });
    reply(422, { message: "No face detected in image" });
    expect(await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN })).toMatchObject({
      ok: false,
      reason: "capture_quality",
    });
  });

  it("uses the image-only liveness path in liveness mode and the path override", async () => {
    vi.stubEnv("PREMBLY_FACE_MODE", "liveness");
    reply(200, { status: true });
    await verifyFaceWithPrembly({ imageBase64: IMG });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/biometrics\/face\/liveliness_check$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ image: IMG });
    vi.stubEnv("PREMBLY_FACE_PATH", "/custom/face");
    reply(200, { status: true });
    await verifyFaceWithPrembly({ imageBase64: IMG });
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/custom\/face$/);
  });

  it("requires a NIN in nin_face mode without calling the provider", async () => {
    const r = await verifyFaceWithPrembly({ imageBase64: IMG, nin: null });
    expect(r).toMatchObject({ ok: false, code: "NIN_REQUIRED", reason: "nin_required" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a network failure as an outage code", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    expect(await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN })).toMatchObject({
      ok: false,
      code: "NETWORK",
      reason: "network",
    });
  });

  it("fails closed in production without a key", async () => {
    vi.stubEnv("PREMBLY_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    const r = await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN });
    expect(r).toMatchObject({ ok: false, code: "NOT_CONFIGURED", reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a labelled local stand-in outside production without a key", async () => {
    vi.stubEnv("PREMBLY_API_KEY", "");
    vi.stubEnv("NODE_ENV", "test");
    const r = await verifyFaceWithPrembly({ imageBase64: IMG, nin: NIN });
    expect(r).toMatchObject({ ok: true, provider: "local", mode: "sandbox_format" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("face payload helpers", () => {
  it("reads face_data from nested Prembly shapes", () => {
    expect(readFaceData({ face_data: { status: true } })?.status).toBe(true);
    expect(
      readFaceData({ data: { face_data: { message: "Face Match" } } })?.message,
    ).toBe("Face Match");
    expect(
      readFaceData({
        data: { nin_data: { face_data: { confidence: 88 } } },
      })?.confidence,
    ).toBe(88);
  });

  it("normalises fractional confidence to 0–100", () => {
    expect(normalizeConfidence(0.95)).toBe(95);
    expect(normalizeConfidence(95)).toBe(95);
    expect(normalizeConfidence("40")).toBe(40);
    expect(normalizeConfidence(-1)).toBeNull();
  });

  it("isFacePass needs a success body and nested face ok", () => {
    expect(isFacePass({ status: false })).toBe(false);
    expect(isFacePass({ response_code: "00" })).toBe(true);
    expect(
      isFacePass({
        status: true,
        data: { face_data: { status: false, message: "No Match" } },
      }),
    ).toBe(false);
    expect(readConfidence({ data: { face_data: { confidence: 0.91 } } })).toBe(91);
  });

  it("classifyFaceFailure maps match, capture and low confidence", () => {
    expect(
      classifyFaceFailure({
        json: { status: true, face_data: { status: false, message: "No Match" } },
        httpStatus: 200,
        confidence: 10,
        minConfidence: 80,
      }),
    ).toBe("match_failed");
    expect(
      classifyFaceFailure({
        json: { message: "No face detected" },
        httpStatus: 422,
        confidence: null,
        minConfidence: 80,
      }),
    ).toBe("capture_quality");
    expect(
      classifyFaceFailure({
        json: { status: true, face_data: { status: true, confidence: 40 } },
        httpStatus: 200,
        confidence: 40,
        minConfidence: 80,
      }),
    ).toBe("low_confidence");
  });

  it("userMessageForFaceFail is honest for NIN mismatch", () => {
    expect(userMessageForFaceFail("match_failed")).toMatch(/NIN photo/i);
    expect(userMessageForFaceFail("capture_quality")).toMatch(/good light/i);
    expect(userMessageForFaceFail("low_confidence")).toMatch(/Hold still/i);
  });
});

describe("liveness evidence helpers", () => {
  it("parseSelfie accepts bounded JPEG/PNG/WebP data URLs only", () => {
    expect(parseSelfie(`data:image/jpeg;base64,${IMG}`)).toMatchObject({ base64: IMG, bytes: 3_000 });
    expect(parseSelfie(`data:image/png;base64,${IMG}`)).not.toBeNull();
    expect(parseSelfie(`data:image/svg+xml;base64,${IMG}`)).toBeNull();
    expect(parseSelfie("data:image/jpeg;base64,AAAA")).toBeNull();
    expect(parseSelfie(`data:image/jpeg;base64,${Buffer.alloc(1_100_000).toString("base64")}`)).toBeNull();
    expect(parseSelfie(`data:image/jpeg;base64,${IMG}<script>`)).toBeNull();
    expect(parseSelfie(42)).toBeNull();
  });

  it("ninOnFile reads plain or encrypted 11-digit NINs only", () => {
    vi.stubEnv("ADMIN_SENSITIVE_PASSWORD", "test-only-secret");
    expect(ninOnFile({ nin_encrypted: NIN })).toBe(NIN);
    expect(ninOnFile({ nin_encrypted: encryptField(NIN) })).toBe(NIN);
    expect(ninOnFile({ nin_encrypted: "A12345678" })).toBeNull();
    expect(ninOnFile(null)).toBeNull();
  });

  it("buildLivenessMeta keeps provider evidence and no identity data", () => {
    const meta = buildLivenessMeta(
      { ok: true, provider: "prembly", mode: "live", checkMode: "nin_face", reference: "", confidence: null },
      3_000,
      "2026-11-23T00:00:00.000Z",
    );
    expect(meta).toEqual({
      source: "server_provider", provider: "prembly", mode: "live", checkMode: "nin_face",
      reference: null, confidence: null, selfieBytes: 3_000, verifiedAt: "2026-11-23T00:00:00.000Z",
    });
  });
});
