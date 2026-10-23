import { describe, expect, it } from "vitest";
import { assertCatalogParity } from "@/lib/i18n/catalog";

describe("catalog parity across all 11 locales", () => {
  it("has zero missing keys in any locale", async () => {
    const issues = await assertCatalogParity();
    expect(issues).toEqual([]);
  });
});
