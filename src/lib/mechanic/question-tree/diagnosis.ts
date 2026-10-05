import type { MechanicPartId } from "./parts";

/**
 * Narrow the answers down to the most likely problem. This is a plain-language
 * "Likely problem" line that rides along in the job summary so the pro arrives
 * with the real issue already identified not a trade guess.
 */
export function mechanicDiagnosis(
  answers: Record<string, string>,
): string | undefined {
  const part = answers.part_pick as MechanicPartId | undefined;

  if (part === "engine" || answers.eng_sym) {
    if (answers.eng_sym === "knock")
      return "Likely engine knock (big end / knocking)";
    if (answers.eng_sym === "misfire")
      return "Likely plug, coil, or injector misfire";
    if (answers.eng_sym === "cut")
      return "Likely engine cutting (fuel, coil, or brain box)";
    if (answers.eng_sym === "overheat") return "Likely engine overheating";
    if (answers.eng_light === "oil") return "Likely low oil or oil-pump fault";
    if (answers.eng_light === "check")
      return "Likely an engine or sensor fault (check engine)";
    return "Likely an engine fault";
  }
  if (part === "gear" || answers.gear_when || answers.g_what) {
    if (answers.gear_fluid === "leak" || answers.gear_fluid === "both") {
      return "Likely gearbox oil leak";
    }
    if (answers.gear_fluid === "burnt") return "Likely burnt gearbox / clutch";
    if (answers.g_what === "slipping")
      return "Likely a slipping clutch or transmission";
    if (answers.g_what === "hard")
      return "Likely a gearbox or clutch engagement fault";
    if (answers.g_what === "no_drive") return "Vehicle has no drive";
    return "Likely a gear / gearbox fault";
  }
  if (part === "steering" || answers.str_feel) {
    if (answers.str_feel === "heavy")
      return "Likely power steering pump or low oil";
    if (answers.str_feel === "noise") return "Likely power steering pump noise";
    if (answers.str_feel === "leak") return "Likely power steering oil leak";
    return "Likely a power steering fault";
  }
  if (part === "brain" || answers.brn_light) {
    if (answers.brn_light === "immobilizer")
      return "Likely immobilizer / brain box not firing";
    if (answers.brn_cut === "yes")
      return "Likely brain box or crank sensor cutting the engine";
    return "Likely a brain box (ECU) or wiring fault";
  }
  if (part === "brakes" || answers.brk_feel) {
    if (answers.brk_feel === "grinding") return "Likely worn brake pad / disc";
    if (answers.brk_feel === "soft")
      return "Likely brake fluid leak or air in line";
    return "Likely a brake fault";
  }
  if (part === "suspension" || answers.sus_feel) {
    if (answers.sus_leak === "yes") return "Likely leaking shock";
    return "Likely a suspension / shock fault";
  }
  if (part === "radiator" || answers.rad_steam) {
    return "Likely a radiator / cooling-system fault";
  }
  if (part === "fuel" || answers.fuel_sym) {
    if (answers.fuel_sym === "pump") return "Likely fuel pump not running";
    if (answers.fuel_tank === "empty") return "Likely no fuel in the tank";
    return "Likely a fuel pump, filter, or injector fault";
  }
  if (part === "exhaust" || answers.exh_sym) {
    if (answers.exh_sym === "loud")
      return "Likely burst silencer / exhaust leak";
    return "Likely an exhaust / silencer fault";
  }
  if (part === "battery" || answers.bat_sym) {
    if (answers.bat_sym === "light")
      return "Likely alternator / charging fault";
    if (answers.bat_jump === "yes") return "Likely a weak or dead battery";
    return "Likely a battery or charging fault";
  }

  const main = answers.start;

  if (main === "A") {
    const what = answers.a_what;
    const lights = answers.a_lights;
    if (what === "silent" && lights === "none") {
      return "Likely a dead battery or a blown fuse";
    }
    if (what === "lights_no_crank") {
      return "Likely a battery or starting-circuit fault";
    }
    if (what === "weak_crank") {
      return "Likely a weak or failing battery";
    }
    if (what === "silent") {
      return "Likely a starter or electrical fault";
    }
    return "Likely a fuel, spark, or sensor fault preventing start";
  }

  if (main === "B") {
    if (answers.b_how === "suddenly" && answers.b_warning === "battery") {
      return "Likely a charging or electrical fault";
    }
    if (answers.b_how === "suddenly") {
      return "Likely a fuel or ignition fault that cut power";
    }
    if (answers.b_how === "shook") {
      return "Likely a fuel or ignition fault under load";
    }
    return "Likely a fuel or engine-management fault";
  }

  if (main === "C") {
    if (
      answers.c_where === "wheels" ||
      answers.c_when === "turning" ||
      answers.c_when === "braking"
    ) {
      return "Likely a wheel, brake, or suspension issue";
    }
    if (answers.c_where === "under") {
      return "Likely an exhaust, mount, or underbody issue";
    }
    return "Likely an engine or drivetrain noise";
  }

  if (main === "D") {
    if (answers.d_ac === "yes") return "Likely related to recent A/C work";
    if (answers.d_red === "yes") {
      return "Likely a cooling-system fault (thermostat, fan, or coolant)";
    }
    return "Likely a cooling-system fault";
  }

  if (main === "E") {
    if (answers.e_color === "white") return "Likely coolant burning";
    if (answers.e_color === "blue")
      return "Likely oil burning (engine or turbo)";
    if (answers.e_color === "black")
      return "Likely a fuel or air mixture issue";
    return "Likely an electrical short or burnt component";
  }

  if (main === "F") {
    if (answers.f_color === "coolant") return "Likely a coolant leak";
    if (answers.f_color === "oil") return "Likely an oil leak";
    return "Likely a fuel or brake-fluid leak";
  }

  if (main === "G") {
    if (answers.g_type === "electric" || answers.g_ev) {
      if (answers.g_ev === "no_drive")
        return "Vehicle has no drive (EV motor or inverter fault)";
      if (answers.g_ev === "loss_power")
        return "Likely an EV motor or inverter fault";
      if (answers.g_ev === "warning") return "EV powertrain warning light on";
      return "Likely an EV motor or drivetrain noise";
    }
    if (answers.g_what === "no_drive") return "Vehicle has no drive";
    if (answers.g_what === "slipping")
      return "Likely a slipping clutch or transmission";
    if (answers.g_what === "hard")
      return "Likely a gearbox or clutch engagement fault";
    return "Likely a transmission fault";
  }

  if (main === "H") {
    if (answers.ev_issue === "charging") {
      return "Likely an EV charging fault (charger, cable, or charge port)";
    }
    if (answers.ev_issue === "battery") {
      return "Likely an EV high-voltage (HV) battery or range fault";
    }
    if (answers.ev_issue === "motor_no_drive") {
      return "Likely an EV motor or inverter fault";
    }
    if (answers.ev_issue === "won_t_start") {
      return "Likely an EV 12V auxiliary battery or start-controller fault";
    }
    return "EV problem (customer described)";
  }

  return undefined;
}
