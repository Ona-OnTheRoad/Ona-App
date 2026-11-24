import { describe, expect, it } from "vitest";
import {
  audienceForAccountType,
  matchesAudience,
  parseAudience,
} from "@/lib/notifications/audience";

describe("notification audience", () => {
  it("maps the account type to the active side", () => {
    expect(audienceForAccountType("professional")).toBe("professional");
    expect(audienceForAccountType("motorist")).toBe("motorist");
    expect(audienceForAccountType(undefined)).toBe("motorist");
  });
  it("a dual-role user only sees the active side's rows", () => {
    const customerRow = { audience: "motorist" as const };
    const proRow = { audience: "professional" as const };
    expect(matchesAudience(customerRow, "motorist")).toBe(true);
    expect(matchesAudience(customerRow, "professional")).toBe(false);
    expect(matchesAudience(proRow, "professional")).toBe(true);
    expect(matchesAudience(proRow, "motorist")).toBe(false);
  });
  it("rows with no audience (security, system) show in both modes", () => {
    expect(matchesAudience({ audience: null }, "motorist")).toBe(true);
    expect(matchesAudience({}, "professional")).toBe(true);
  });
  it("ignores unknown audience values", () => {
    expect(parseAudience("admin")).toBeNull();
    expect(parseAudience("motorist")).toBe("motorist");
  });
});
