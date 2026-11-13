import { describe, expect, it } from "vitest";
import { changeContactKey, normalizeContactTarget } from "../change-contact-otp";
import { signupOtpKey } from "../signup-otp";

describe("normalizeContactTarget", () => {
  it.each([
    ["phone", "08012345678", "+2348012345678"],
    ["phone", "+234 801 234 5678", "+2348012345678"],
    ["phone", "2348012345678", "+2348012345678"],
    ["email", "  Ada@Ona.TEST ", "ada@ona.test"],
  ] as const)("%s %s -> %s", (channel, raw, expected) => {
    expect(normalizeContactTarget(channel, raw)).toBe(expected);
  });
  it.each([["phone", "12"], ["phone", "abc"], ["email", "nope"], ["email", "a@b"], ["email", "a b@c.com"], ["email", ""]] as const)(
    "rejects %s %s",
    (channel, raw) => expect(normalizeContactTarget(channel, raw)).toBeNull(),
  );
});

describe("changeContactKey namespaces", () => {
  it("is bound to the user and the exact contact", () => {
    expect(changeContactKey("u1", "phone", "+2348012345678")).not.toBe(changeContactKey("u2", "phone", "+2348012345678"));
    expect(changeContactKey("u1", "phone", "+2348012345678")).not.toBe(changeContactKey("u1", "phone", "+2348099999999"));
  });
  it("never collides with login, email-login or signup keys", () => {
    const phone = "+2348012345678";
    expect(changeContactKey("u1", "phone", phone)).not.toBe(phone);
    expect(changeContactKey("u1", "phone", phone)).not.toBe(signupOtpKey(phone));
    expect(changeContactKey("u1", "email", "a@b.co")).not.toBe("email:a@b.co");
    expect(changeContactKey("u1", "phone", phone).startsWith("change:")).toBe(true);
  });
});
