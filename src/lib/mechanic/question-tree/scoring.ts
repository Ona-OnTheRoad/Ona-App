import { MECHANIC_PART_IDS, type MechanicPartId } from "./parts";

function bump(
  scores: Record<MechanicPartId, number>,
  id: MechanicPartId,
  n: number,
) {
  scores[id] += n;
}

/**
 * Rank major systems from the symptom answers so far.
 * Higher score = more likely. Used to auto-open one cascade, or to
 * ask “Which of these is it?” when two or more are close.
 */
export function scoreMechanicParts(
  answers: Record<string, string>,
): Record<MechanicPartId, number> {
  const s = Object.fromEntries(
    MECHANIC_PART_IDS.map((id) => [id, 0]),
  ) as Record<MechanicPartId, number>;
  const main = answers.start;

  if (main === "A") {
    const what = answers.a_what;
    const lights = answers.a_lights;
    if (what === "silent" && lights === "none") bump(s, "battery", 6);
    else if (what === "lights_no_crank") {
      bump(s, "battery", 5);
      bump(s, "brain", 2);
    } else if (what === "weak_crank") bump(s, "battery", 6);
    else if (what === "cranks_no_start") {
      bump(s, "engine", 4);
      bump(s, "fuel", 4);
      bump(s, "brain", 3);
    } else if (what === "silent") {
      bump(s, "battery", 3);
      bump(s, "brain", 2);
    }
    if (answers.a_recent === "yes") bump(s, "battery", 2);
  }

  if (main === "B") {
    if (answers.b_warning === "battery") bump(s, "battery", 5);
    if (answers.b_warning === "check_engine") {
      bump(s, "brain", 5);
      bump(s, "engine", 2);
    }
    if (answers.b_warning === "temperature") {
      bump(s, "radiator", 5);
      bump(s, "engine", 2);
    }
    if (answers.b_warning === "oil") bump(s, "engine", 5);
    if (answers.b_how === "suddenly") {
      bump(s, "fuel", 3);
      bump(s, "brain", 3);
      bump(s, "engine", 2);
    }
    if (answers.b_how === "shook") {
      bump(s, "engine", 3);
      bump(s, "fuel", 3);
    }
    if (answers.b_how === "gradual") {
      bump(s, "fuel", 3);
      bump(s, "engine", 2);
    }
  }

  if (main === "C") {
    if (answers.c_where === "engine") bump(s, "engine", 5);
    if (answers.c_where === "under") {
      bump(s, "exhaust", 4);
      bump(s, "gear", 2);
    }
    if (answers.c_where === "wheels") {
      bump(s, "brakes", 3);
      bump(s, "suspension", 3);
    }
    if (answers.c_where === "exhaust") bump(s, "exhaust", 6);
    if (answers.c_where === "cabin") {
      bump(s, "brain", 2);
      bump(s, "gear", 1);
    }
    if (answers.c_when === "turning") {
      bump(s, "steering", 6);
      bump(s, "suspension", 2);
    }
    if (answers.c_when === "braking") bump(s, "brakes", 6);
    if (answers.c_when === "idle") bump(s, "engine", 3);
    if (answers.c_sound === "knocking" && answers.c_where === "engine") {
      bump(s, "engine", 3);
    }
    if (answers.c_sound === "whining") {
      bump(s, "steering", 2);
      bump(s, "gear", 2);
    }
    if (answers.c_sound === "grinding") {
      bump(s, "brakes", 3);
      bump(s, "gear", 2);
    }
    if (answers.c_sound === "squealing") {
      bump(s, "brakes", 2);
      bump(s, "steering", 2);
    }
  }

  if (main === "D") {
    bump(s, "radiator", 6);
    bump(s, "engine", 2);
    if (answers.d_steam === "yes") bump(s, "radiator", 2);
  }

  if (main === "E") {
    if (answers.e_color === "white") {
      bump(s, "radiator", 4);
      bump(s, "engine", 2);
    }
    if (answers.e_color === "blue") bump(s, "engine", 6);
    if (answers.e_color === "black") {
      bump(s, "fuel", 4);
      bump(s, "engine", 2);
    }
    if (answers.e_where === "exhaust") bump(s, "exhaust", 3);
    if (answers.e_where === "bonnet") bump(s, "engine", 3);
  }

  if (main === "F") {
    if (answers.f_color === "oil") {
      bump(s, "engine", 4);
      bump(s, "gear", 2);
    }
    if (answers.f_color === "coolant") bump(s, "radiator", 6);
    if (answers.f_color === "clear") {
      bump(s, "fuel", 3);
      bump(s, "brakes", 2);
      bump(s, "steering", 2);
    }
    if (answers.f_color === "unknown") {
      bump(s, "engine", 1);
      bump(s, "radiator", 1);
      bump(s, "steering", 1);
    }
  }

  if (main === "G") bump(s, "gear", 8);

  if (main === "I" && answers.l_related === "vehicle") {
    for (const id of MECHANIC_PART_IDS) bump(s, id, 1);
  }

  return s;
}

/** Close scores → picker. One clear winner → go straight into that cascade. */
export function rankMechanicParts(
  answers: Record<string, string>,
): MechanicPartId[] {
  const scores = scoreMechanicParts(answers);
  const sorted = MECHANIC_PART_IDS.map((id) => [id, scores[id]] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return [];
  const top = sorted[0][1];
  const second = sorted[1]?.[1] ?? 0;
  if (sorted.length === 1 || second < top * 0.4) return [sorted[0][0]];
  return sorted
    .filter(([, n]) => n >= top * 0.45)
    .slice(0, 8)
    .map(([id]) => id);
}
