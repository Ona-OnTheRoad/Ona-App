import { describe, expect, it } from "vitest";
import { GEN_SCREENS, GEN_START_OPTIONS, nextGeneratorScreen } from "@/lib/generator/question-tree";
import { SOLAR_SCREENS, SOLAR_START_OPTIONS, nextSolarScreen } from "@/lib/solar/question-tree";
import { PLUMBER_SCREENS, PLUMBER_START_OPTIONS, nextPlumberScreen } from "@/lib/plumber/question-tree";

type Screen = {
  kind: string;
  question?: string;
  options?: ReadonlyArray<{ id: string; label: string }>;
};

/**
 * Walks every start branch of a trade, always taking the first answer, and
 * checks each screen exists, asks something, and (for choices) offers real options.
 * Guards against dead-end or blank screens like the one testers reported.
 */
function walk(
  name: string,
  screens: Record<string, Screen>,
  starts: ReadonlyArray<{ id: string }>,
  next: (step: string, answer: string, answers: Record<string, string>) => string,
  firstStep: string,
) {
  describe(`${name} question walk`, () => {
    for (const start of starts) {
      it(`branch ${start.id} reaches the end with usable screens`, () => {
        const answers: Record<string, string> = { start: start.id, machine_type: "petrol" };
        let step = next("start", start.id, answers);
        const seen = new Set<string>();
        let depth = 0;
        while (step !== "final" && step !== "confirm") {
          expect(seen.has(step), `loop at ${step}`).toBe(false);
          seen.add(step);
          const screen = screens[step];
          expect(screen, `missing screen ${step}`).toBeDefined();
          expect(screen.question?.trim().length).toBeGreaterThan(0);
          let answer = "free text";
          if (screen.kind === "choice") {
            expect(screen.options?.length ?? 0, `${step} has no options`).toBeGreaterThanOrEqual(2);
            answer = screen.options![0].id;
            answers[`${step}_label`] = screen.options![0].label;
          }
          answers[step] = answer;
          step = next(step, answer, answers);
          expect(++depth).toBeLessThan(15);
        }
        expect(seen.size).toBeGreaterThanOrEqual(3);
      });
    }
    it("opens on a defined first step", () => {
      expect(screens[firstStep]).toBeDefined();
    });
  });
}

walk("generator", GEN_SCREENS, GEN_START_OPTIONS, nextGeneratorScreen, "start");
walk("solar", SOLAR_SCREENS, SOLAR_START_OPTIONS, nextSolarScreen, "start");
walk("plumber", PLUMBER_SCREENS, PLUMBER_START_OPTIONS, nextPlumberScreen, "start");
