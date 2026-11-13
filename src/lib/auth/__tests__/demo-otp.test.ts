import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_OTP_CODE, isDemoOtp, isDemoOtpAllowed } from "@/lib/auth/demo-otp";

afterEach(() => vi.unstubAllEnvs());

function production(server?: string, pub?: string) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("OTP_DEMO_MODE", server ?? "");
  vi.stubEnv("NEXT_PUBLIC_OTP_DEMO_MODE", pub ?? "");
}

describe("isDemoOtpAllowed", () => {
  it("stays on outside production whatever the flags say", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OTP_DEMO_MODE", "false");
    vi.stubEnv("NEXT_PUBLIC_OTP_DEMO_MODE", "false");
    expect(isDemoOtpAllowed()).toBe(true);
  });

  it("is off in production when no flag is set", () => {
    production();
    expect(isDemoOtpAllowed()).toBe(false);
  });

  it.each(["false", "0", "yes", "[sensitive]", "sensitive", " "])(
    "is off in production for a flag value of %j",
    (value) => {
      production(value, value);
      expect(isDemoOtpAllowed()).toBe(false);
    },
  );

  it.each(["true", "TRUE", " true ", "1"])(
    "is on in production when the server flag is %j",
    (value) => {
      production(value);
      expect(isDemoOtpAllowed()).toBe(true);
    },
  );

  it("is on in production when only the public flag is true", () => {
    production("", "true");
    expect(isDemoOtpAllowed()).toBe(true);
  });
});

describe("isDemoOtp", () => {
  it("matches the demo code ignoring separators", () => {
    expect(isDemoOtp(`${DEMO_OTP_CODE.slice(0, 3)} ${DEMO_OTP_CODE.slice(3)}`)).toBe(true);
    expect(isDemoOtp("123456")).toBe(false);
    expect(isDemoOtp(null)).toBe(false);
  });
});
