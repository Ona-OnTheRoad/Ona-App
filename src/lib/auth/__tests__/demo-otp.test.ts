import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDemoOtpAllowed, legacyDemoOtpAllowed } from "../demo-otp";

const KEYS = [
  "AT_API_KEY",
  "AT_USERNAME",
  "OTP_DEMO_MODE",
  "NEXT_PUBLIC_OTP_DEMO_MODE",
  "OTP_PHONE_DEMO_MODE",
  "NEXT_PUBLIC_OTP_PHONE_DEMO_MODE",
] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.stubEnv("NODE_ENV", "production");
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("phone channel", () => {
  it("allows the demo code outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDemoOtpAllowed("phone")).toBe(true);
  });

  it("is unchanged before go-live: demo allowed while Africa's Talking is not configured", () => {
    expect(isDemoOtpAllowed("phone")).toBe(true);
  });

  it("switches off by itself once Africa's Talking is configured", () => {
    process.env.AT_USERNAME = "ona";
    process.env.AT_API_KEY = "key";
    expect(isDemoOtpAllowed("phone")).toBe(false);
  });

  it("stays on if only half of the credentials are present", () => {
    process.env.AT_API_KEY = "key";
    expect(isDemoOtpAllowed("phone")).toBe(true);
  });

  it("does not let the legacy OTP_DEMO_MODE=true re-open phone demo once SMS is live", () => {
    process.env.AT_USERNAME = "ona";
    process.env.AT_API_KEY = "key";
    process.env.OTP_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE = "true";
    expect(isDemoOtpAllowed("phone")).toBe(false);
  });

  it("honours an explicit OTP_PHONE_DEMO_MODE override either way", () => {
    process.env.OTP_PHONE_DEMO_MODE = "false";
    expect(isDemoOtpAllowed("phone")).toBe(false);
    process.env.AT_USERNAME = "ona";
    process.env.AT_API_KEY = "key";
    process.env.OTP_PHONE_DEMO_MODE = "true";
    expect(isDemoOtpAllowed("phone")).toBe(true);
  });
});

describe("email channel", () => {
  it("keeps the legacy rule until email delivery exists", () => {
    expect(isDemoOtpAllowed("email")).toBe(true);
    expect(isDemoOtpAllowed("email")).toBe(legacyDemoOtpAllowed());
    process.env.OTP_DEMO_MODE = "false";
    expect(isDemoOtpAllowed("email")).toBe(false);
  });

  it("is not affected by Africa's Talking being configured", () => {
    process.env.AT_USERNAME = "ona";
    process.env.AT_API_KEY = "key";
    expect(isDemoOtpAllowed("email")).toBe(true);
  });
});
