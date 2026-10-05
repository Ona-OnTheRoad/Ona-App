// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compressDocumentFile } from "@/lib/image-compress";

const BIG = 300 * 1024; // above the 250 KB skip threshold

function file(bytes: number, type: string, name = "photo") {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** Stub the browser image pipeline: decode succeeds (or fails) and canvas returns a tiny JPEG. */
function stubImagePipeline(decode: "ok" | "fail") {
  class FakeImage {
    width = 4000;
    height = 3000;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      setTimeout(() => (decode === "ok" ? this.onload?.() : this.onerror?.()), 0);
    }
  }
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: () => undefined,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/jpeg;base64,SMALL",
  );
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("compressDocumentFile", () => {
  it("compresses a large phone photo", async () => {
    stubImagePipeline("ok");
    const out = await compressDocumentFile(file(BIG, "image/jpeg"));
    expect(out).toBe("data:image/jpeg;base64,SMALL");
  });

  it("leaves small images untouched (no re-encoding artefacts)", async () => {
    stubImagePipeline("ok");
    const out = await compressDocumentFile(file(10 * 1024, "image/jpeg"));
    expect(out).not.toBe("data:image/jpeg;base64,SMALL");
    expect(out.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("passes non-images (PDF) and animated or vector images through unchanged", async () => {
    stubImagePipeline("ok");
    for (const type of ["application/pdf", "image/gif", "image/svg+xml"]) {
      const out = await compressDocumentFile(file(BIG, type));
      expect(out).not.toBe("data:image/jpeg;base64,SMALL");
      expect(out.startsWith(`data:${type};base64,`)).toBe(true);
    }
  });

  it("falls back to the original photo when the browser cannot decode it", async () => {
    stubImagePipeline("fail");
    const out = await compressDocumentFile(file(BIG, "image/heic"));
    expect(out.startsWith("data:image/heic;base64,")).toBe(true);
  });
});
