import { describe, expect, it } from "vitest";
import {
  isValidPassword,
  passwordChecklist,
  passwordError,
} from "@/lib/signup-validation";

describe("password policy", () => {
  it("accepts 10+ chars with number, lowercase, uppercase and symbol", () => {
    expect(passwordError("Passw0rd!xyz")).toBeNull();
    expect(isValidPassword("Abcdefg1!j")).toBe(true);
  });

  it.each([
    ["Sh0rt!aA", "at least 10"],
    ["Password!!!x", "number"],
    ["PASSWORD1!!!", "lowercase"],
    ["password1!!!", "uppercase"],
    ["Password1234", "symbol"],
  ])("rejects %s (%s)", (pw, hint) => {
    expect(passwordError(pw)?.toLowerCase()).toContain(hint);
    expect(isValidPassword(pw)).toBe(false);
  });

  it("lists the five requirements in design order", () => {
    const rows = passwordChecklist("abc");
    expect(rows.map((r) => r.text)).toEqual([
      "At least 10 characters",
      "At least a number",
      "At least one lowercase letter",
      "At least one uppercase letter",
      "At least one symbol",
    ]);
    expect(rows.map((r) => r.ok)).toEqual([false, false, true, false, false]);
  });
});
