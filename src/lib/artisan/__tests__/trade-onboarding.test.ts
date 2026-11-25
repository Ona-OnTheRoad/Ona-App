import { describe, expect, it } from "vitest";
import { needsVehiclesSignupStep } from "@/lib/artisan/catalog";
import { toolSuggestionsFor } from "@/lib/artisan/trade-tools";
import { coreFocusLabel, tradeFocusQuestion } from "@/lib/artisan/trade-copy";
import { labourFeeDisclaimerForTrade } from "@/lib/pricing";
import { professionQuestionsFor } from "@/lib/artisan/profession-questions";
import { formatProSkill } from "@/lib/pro-service-id";

describe("trade-aware onboarding", () => {
  it("only vehicle trades get the vehicles step", () => {
    for (const t of [
      "fashion",
      "plumber",
      "carpenter",
      "painter",
      "solar",
      "generator",
    ]) {
      expect(needsVehiclesSignupStep(t, "Anything")).toBe(false);
    }
    expect(needsVehiclesSignupStep("mechanic")).toBe(true);
    expect(needsVehiclesSignupStep("ac", "Vehicle")).toBe(true);
    expect(needsVehiclesSignupStep("ac", "Residential (Homes)")).toBe(false);
  });

  it("fashion has its own copy, tools and pricing text", () => {
    expect(labourFeeDisclaimerForTrade("fashion")).not.toMatch(/tyre|motor/i);
    expect(toolSuggestionsFor("fashion")).toContain("Sewing machine");
    expect(coreFocusLabel("fashion")).toBe("My Specialties");
    expect(tradeFocusQuestion("fashion")).toBe("What do you specialise in?");
    expect(tradeFocusQuestion("plumber")).toBe("Where do you mainly work?");
    expect(
      professionQuestionsFor("fashion").some((q) => q.id === "own_transport"),
    ).toBe(false);
    expect(
      professionQuestionsFor("plumber").some((q) => q.id === "own_transport"),
    ).toBe(true);
  });

  it("missing trade does not fall back to mechanic", () => {
    expect(formatProSkill(null)).toBe("Repair Pro");
    expect(professionQuestionsFor("nope" as never)).toEqual([]);
  });
});
