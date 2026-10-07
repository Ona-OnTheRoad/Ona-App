import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyCharge } from "../providers";

const strict = { strictProvider: true };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL_ENV", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "test-flutterwave-key");
  vi.stubEnv("PAYSTACK_SECRET_KEY", "test-paystack-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function reply(data: unknown, status: unknown = "success", httpStatus = 200) {
  fetchMock.mockResolvedValue(Response.json({ status, data }, { status: httpStatus }));
}

describe("strict stored-provider verification", () => {
  it("converts Flutterwave major units to exact minor units", async () => {
    reply({ status: "successful", amount: 1234.56, currency: "NGN", tx_ref: "ref" });
    expect(await verifyCharge("ref", "flutterwave", strict)).toMatchObject({
      success: true, amountMinor: 123456, reference: "ref", currency: "NGN",
    });
    expect(fetchMock.mock.calls[0][0]).toContain("api.flutterwave.com/v3/transactions/verify_by_reference");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
  it.each([1000.0001, "1000.001", true, null])("refuses amounts requiring rounding: %s", async (amount) => {
    reply({ status: "successful", amount, currency: "NGN", tx_ref: "ref" });
    expect((await verifyCharge("ref", "flutterwave", strict)).amountMinor).toBeNaN();
  });
  it("does not accept undocumented success aliases", async () => {
    reply({ status: "success", amount: 1000, currency: "NGN", tx_ref: "ref" });
    expect((await verifyCharge("ref", "flutterwave", strict)).success).toBe(false);
    reply({ status: "success", amount: 100000, currency: "NGN", reference: "ref" }, "success");
    expect((await verifyCharge("ref", "paystack", strict)).success).toBe(false);
  });
  it("does not allow environment labels to mask production mock restrictions", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "development");
    await expect(verifyCharge("ref", "mock", strict)).rejects.toThrow("disabled");
  });
  it("keeps Paystack minor units unchanged", async () => {
    reply({ status: "success", amount: 123456, currency: "NGN", reference: "ref" }, true);
    expect(await verifyCharge("ref", "paystack", strict)).toMatchObject({ success: true, amountMinor: 123456 });
    expect(fetchMock.mock.calls[0][0]).toContain("api.paystack.co");
  });
  it.each(["flutterwave", "paystack"])("does not synthesize missing currency/reference for %s", async (provider) => {
    reply({ status: "success", amount: 100 }, provider === "paystack" ? true : "success");
    expect(await verifyCharge("ref", provider, strict)).toMatchObject({ reference: "", currency: "" });
  });
  it.each(["flutterwave", "paystack"])("does not switch away from missing %s credentials", async (provider) => {
    vi.stubEnv(provider === "flutterwave" ? "FLUTTERWAVE_SECRET_KEY" : "PAYSTACK_SECRET_KEY", "");
    await expect(verifyCharge("ref", provider, strict)).rejects.toThrow("not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed on unsupported provider and deployed mock", async () => {
    await expect(verifyCharge("ref", "manual", strict)).rejects.toThrow("Unsupported");
    vi.stubEnv("VERCEL_ENV", "preview");
    await expect(verifyCharge("ref", "mock", strict)).rejects.toThrow("disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("refuses an HTTP error even if its body claims success", async () => {
    reply({ status: "successful", amount: 1000, currency: "NGN", tx_ref: "ref" }, "success", 503);
    await expect(verifyCharge("ref", "flutterwave", strict)).rejects.toThrow("unavailable");
  });
});
