/**
 * Narrow the tyre answers down to the most likely problem so the pro
 * arrives with the real issue already identified.
 */
export function vulcanizerDiagnosis(
  answers: Record<string, string>,
): string | undefined {
  const main = answers.start;

  if (main === "A") {
    if (answers.a_which === "more") {
      return "Multiple tyres affected likely a puncture or worn tyres";
    }
    if (answers.a_spare === "no") {
      return "No spare available tyre beyond a roadside fix";
    }
    return "Likely a puncture or flat tyre";
  }

  if (main === "B") return "Likely a burst or blown tyre";

  if (main === "C") return "Slow puncture or air loss";

  if (main === "D") {
    if (answers.d_how === "accident")
      return "Likely rim or wheel damage from an accident";
    return "Likely a damaged, bent, or cracked rim";
  }

  if (main === "E") return "Likely a wheel-balancing or alignment issue";

  if (main === "F") return "Tyre replacement needed";

  if (main === "G") {
    return "Multiple tyres affected likely worn or damaged tyres";
  }

  return undefined;
}
