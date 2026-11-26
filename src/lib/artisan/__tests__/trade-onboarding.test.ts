import { describe, expect, it } from "vitest";
import { needsVehiclesSignupStep } from "@/lib/artisan/catalog";
import { toolSuggestionsFor } from "@/lib/artisan/trade-tools";
import { coreFocusLabel, tradeFocusQuestion } from "@/lib/artisan/trade-copy";
import { labourFeeDisclaimerForTrade } from "@/lib/pricing";
import { professionQuestionsFor } from "@/lib/artisan/profession-questions";
import { PRO_ROLE_LABEL, isProPlaceholderName } from "@/lib/pro-label";
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
    expect(formatProSkill(null)).toBe("Service Pro");
    expect(professionQuestionsFor("nope" as never)).toEqual([]);
  });

  it("uses Service Pro and still recognises legacy placeholder names", () => {
    expect(PRO_ROLE_LABEL).toBe("Service Pro");
    expect(formatProSkill(null)).toBe("Service Pro");
    expect(isProPlaceholderName("Repair Pro")).toBe(true);
    expect(isProPlaceholderName(" Service Pro ")).toBe(true);
    expect(isProPlaceholderName("Kola Fashion House")).toBe(false);
  });
});
