import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_OTP_CODE,
  isDemoFallbackAllowed,
  isDemoOtp,
  isDemoOtpAllowed,
} from "@/lib/auth/demo-otp";

afterEach(() => vi.unstubAllEnvs());

function production(server?: string, pub?: string) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("OTP_DEMO_MODE", server ?? "");
  vi.stubEnv("NEXT_PUBLIC_OTP_DEMO_MODE", pub ?? "");
}

function development(server?: string, pub?: string) {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("OTP_DEMO_MODE", server ?? "");
  vi.stubEnv("NEXT_PUBLIC_OTP_DEMO_MODE", pub ?? "");
}

describe("isDemoOtpAllowed outside production", () => {
  it("is on when no flag is set", () => {
    development();
    expect(isDemoOtpAllowed()).toBe(true);
  });

  it("is on when both flags are blank", () => {
    development(" ", " ");
    expect(isDemoOtpAllowed()).toBe(true);
  });

  it.each(["false", "0", "off", "FALSE"])(
    "is off when the server flag is %j and the public flag is unset",
    (value) => {
      development(value);
      expect(isDemoOtpAllowed()).toBe(false);
    },
  );

  it("is off when only the public flag is false", () => {
    development("", "false");
    expect(isDemoOtpAllowed()).toBe(false);
  });

  it("is off when both flags are false", () => {
    development("false", "false");
    expect(isDemoOtpAllowed()).toBe(false);
  });

  it.each([["true", ""], ["1", ""], ["", "true"], ["false", "true"], ["true", "false"]])(
    "is on when server=%j, public=%j",
    (server, pub) => {
      development(server, pub);
      expect(isDemoOtpAllowed()).toBe(true);
    },
  );
});

describe("isDemoOtpAllowed", () => {

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

describe("isDemoFallbackAllowed", () => {
  it.each([["", ""], ["false", "false"], ["true", "true"]])(
    "is always on outside production (server=%j, public=%j), devOnly or not",
    (server, pub) => {
      development(server, pub);
      expect(isDemoFallbackAllowed()).toBe(true);
      expect(isDemoFallbackAllowed({ devOnly: true })).toBe(true);
    },
  );

  it("follows the demo flag in production", () => {
    production("true", "true");
    expect(isDemoFallbackAllowed()).toBe(true);
    production("false", "false");
    expect(isDemoFallbackAllowed()).toBe(false);
    production();
    expect(isDemoFallbackAllowed()).toBe(false);
  });

  it("is never on in production for devOnly callers, even with the flag on", () => {
    production("true", "true");
    expect(isDemoFallbackAllowed({ devOnly: true })).toBe(false);
  });
});

describe("isDemoOtp", () => {
  it("matches the demo code ignoring separators", () => {
    expect(isDemoOtp(`${DEMO_OTP_CODE.slice(0, 3)} ${DEMO_OTP_CODE.slice(3)}`)).toBe(true);
    expect(isDemoOtp("123456")).toBe(false);
    expect(isDemoOtp(null)).toBe(false);
  });
});
