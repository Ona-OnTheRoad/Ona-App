// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  isAuthFormRoute,
  isDualRoleSignupPath,
} from "@/components/auth/auth-gate/boot-routes";
import { smartBackFallback } from "@/lib/navigation";
import { isPublicPath } from "@/lib/routes";

describe("signup order routes", () => {
  it("back chain is verify -> details -> welcome; wizards -> role", () => {
    expect(smartBackFallback("/signup/verify")).toBe("/signup");
    expect(smartBackFallback("/signup")).toBe("/login");
    expect(smartBackFallback("/signup/motorist")).toBe("/login/role");
    expect(smartBackFallback("/signup/pro")).toBe("/login/role");
  });

  it("/signup and /signup/verify are public auth-form routes", () => {
    for (const p of ["/signup", "/signup/verify", "/login/role"]) {
      expect(isPublicPath(p)).toBe(true);
      expect(isAuthFormRoute(p)).toBe(true);
    }
  });

  it("signed-in users may open /signup only for menu/profile dual signup", () => {
    window.history.pushState({}, "", "/signup");
    expect(isDualRoleSignupPath("/signup", true, true)).toBe(false);
    window.history.pushState({}, "", "/signup?from=menu&attach=1");
    expect(isDualRoleSignupPath("/signup", true, true)).toBe(true);
    expect(isDualRoleSignupPath("/signup/verify", true, true)).toBe(false);
  });
});
