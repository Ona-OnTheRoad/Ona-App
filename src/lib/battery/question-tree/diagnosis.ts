/**
 * Narrow the battery answers down to the most likely problem so the pro
 * arrives with the real issue already identified.
 */
export function batteryDiagnosis(
  answers: Record<string, string>,
): string | undefined {
  const main = answers.start;

  if (main === "A") {
    if (answers.a_terminals === "no") {
      return "Likely corroded or loose battery terminals";
    }
    return "Likely a dead or weak battery";
  }

  if (main === "B") {
    if (answers.b_recent === "yes") {
      return "Likely an electrical fault rather than the battery";
    }
    return "Likely a weak battery";
  }

  if (main === "C") return "Likely a weak or failing battery";

  if (main === "D") {
    if (answers.d_warning === "yes") {
      return "Likely a charging-system (alternator) fault";
    }
    return "Likely a battery that no longer holds a charge";
  }

  if (main === "E") return "Battery needs testing or replacement";

  if (main === "F") return "Likely a charging-system fault";

  if (main === "H") {
    if (answers.ev_type === "12v") {
      return "Likely a dead EV 12V auxiliary battery (won't go into ready)";
    }
    if (answers.ev_type === "hv") {
      return "Likely an EV high-voltage (HV) battery or range fault";
    }
    if (answers.ev_type === "charging") {
      return "Likely an EV charging fault (charger, cable, or charge port)";
    }
    return "EV battery problem (customer described)";
  }

  return undefined;
}
