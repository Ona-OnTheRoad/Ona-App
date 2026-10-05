import type { MechanicScreen } from "./types";
import { YES_NO } from "./constants";

export const MECHANIC_SCREENS_C: Record<string, MechanicScreen> = {
  str_feel: {
    id: "str_feel",
    question: "How is the power steering?",
    kind: "choice",
    options: [
      { id: "heavy", label: "Steering is heavy / hard to turn" },
      { id: "noise", label: "Whining or screaming when you turn" },
      { id: "leak", label: "Power steering oil leaking" },
      { id: "shake", label: "Steering shakes in your hand" },
    ],
  },
  str_when: {
    id: "str_when",
    question: "When is it worst?",
    kind: "choice",
    options: [
      { id: "idle_turn", label: "Turning while the car is slow / parked" },
      { id: "moving", label: "While driving" },
      { id: "always", label: "Always" },
    ],
  },
  str_fluid: {
    id: "str_fluid",
    question: "Is the power steering oil low?",
    kind: "choice",
    options: [
      { id: "low", label: "Yes, oil is low" },
      { id: "ok", label: "Oil looks okay" },
      { id: "unknown", label: "I have not checked" },
    ],
  },
  str_lock: {
    id: "str_lock",
    question: "Can you still turn the wheel?",
    kind: "choice",
    options: YES_NO,
  },
  brn_light: {
    id: "brn_light",
    question: "What is the brain box showing?",
    kind: "choice",
    options: [
      { id: "check", label: "Check engine light staying on" },
      { id: "many", label: "Many lights coming on together" },
      { id: "immobilizer", label: "Car locks / immobilizer, will not fire" },
      { id: "none", label: "No light, but it behaves like wiring/brain" },
    ],
  },
  brn_cut: {
    id: "brn_cut",
    question: "Does it cut suddenly like someone removed the key?",
    kind: "choice",
    options: YES_NO,
  },
  brn_work: {
    id: "brn_work",
    question: "Any recent work on the brain box, wiring, or alarm?",
    kind: "choice",
    options: YES_NO,
  },
  brn_scan: {
    id: "brn_scan",
    question: "Has anyone scanned it with a diagnostic machine?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, already scanned" },
      { id: "no", label: "Not yet" },
    ],
  },
  brk_feel: {
    id: "brk_feel",
    question: "How is the brake?",
    kind: "choice",
    options: [
      { id: "grinding", label: "Grinding / metal-on-metal" },
      { id: "soft", label: "Pedal is soft / goes down" },
      { id: "hard", label: "Pedal is hard, poor stopping" },
      { id: "noise", label: "Squealing when you brake" },
    ],
  },
  brk_pull: {
    id: "brk_pull",
    question: "Does it pull to one side when you brake?",
    kind: "choice",
    options: YES_NO,
  },
  brk_light: {
    id: "brk_light",
    question: "ABS or brake light on?",
    kind: "choice",
    options: [
      { id: "abs", label: "ABS light" },
      { id: "brake", label: "Brake light" },
      { id: "both", label: "Both" },
      { id: "none", label: "None" },
    ],
  },
  sus_feel: {
    id: "sus_feel",
    question: "How is the suspension / shock?",
    kind: "choice",
    options: [
      { id: "bounce", label: "Car is bouncing" },
      { id: "knock", label: "Knocking on bump" },
      { id: "lean", label: "Leaning to one side" },
      { id: "harsh", label: "Too hard / hitting every hole" },
    ],
  },
  sus_where: {
    id: "sus_where",
    question: "Which side?",
    kind: "choice",
    options: [
      { id: "front", label: "Front" },
      { id: "rear", label: "Rear" },
      { id: "one", label: "One side only" },
      { id: "all", label: "All round" },
    ],
  },
  sus_leak: {
    id: "sus_leak",
    question: "Is the shock leaking oil?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unknown", label: "I have not checked" },
    ],
  },
  rad_steam: {
    id: "rad_steam",
    question: "What is the radiator / cooling doing?",
    kind: "choice",
    options: [
      { id: "steam", label: "Steam / boiling" },
      { id: "needle", label: "Needle in red, no steam" },
      { id: "fan", label: "Fan not coming on" },
      { id: "leak", label: "Water leaking" },
    ],
  },
  rad_level: {
    id: "rad_level",
    question: "Is the radiator water low?",
    kind: "choice",
    options: [
      { id: "low", label: "Yes, water is low" },
      { id: "ok", label: "Water looks okay" },
      { id: "unknown", label: "I have not checked" },
    ],
  },
  rad_when: {
    id: "rad_when",
    question: "When does it heat?",
    kind: "choice",
    options: [
      { id: "traffic", label: "In traffic" },
      { id: "highway", label: "On a long drive" },
      { id: "always", label: "Anytime" },
    ],
  },
  fuel_sym: {
    id: "fuel_sym",
    question: "What is the fuel system doing?",
    kind: "choice",
    options: [
      { id: "no_fuel", label: "Not getting fuel" },
      { id: "starve", label: "Starving / dying when you accelerate" },
      { id: "smell", label: "Smelling fuel" },
      { id: "pump", label: "No pump sound when you switch on" },
    ],
  },
  fuel_tank: {
    id: "fuel_tank",
    question: "How is the tank?",
    kind: "choice",
    options: [
      { id: "empty", label: "Low / empty" },
      { id: "filled", label: "Just filled" },
      { id: "ok", label: "Has fuel" },
    ],
  },
  fuel_work: {
    id: "fuel_work",
    question: "Any recent pump, filter, or injector work?",
    kind: "choice",
    options: YES_NO,
  },
  exh_sym: {
    id: "exh_sym",
    question: "What is the exhaust / silencer doing?",
    kind: "choice",
    options: [
      { id: "loud", label: "Too loud / bursting" },
      { id: "smoke", label: "Smoke from the silencer" },
      { id: "hang", label: "Hanging / hitting the ground" },
      { id: "smell", label: "Strong exhaust smell in the cabin" },
    ],
  },
  exh_smoke: {
    id: "exh_smoke",
    question: "If there is smoke, what colour?",
    kind: "choice",
    options: [
      { id: "white", label: "White" },
      { id: "blue", label: "Blue / grey" },
      { id: "black", label: "Black" },
      { id: "none", label: "No smoke" },
    ],
  },
  exh_where: {
    id: "exh_where",
    question: "Where on the exhaust?",
    kind: "choice",
    options: [
      { id: "front", label: "Front pipe / manifold" },
      { id: "middle", label: "Middle / cat" },
      { id: "silencer", label: "Silencer at the back" },
      { id: "unknown", label: "I am not sure" },
    ],
  },
  bat_sym: {
    id: "bat_sym",
    question: "What is the battery / charging doing?",
    kind: "choice",
    options: [
      { id: "dead", label: "Completely dead" },
      { id: "slow", label: "Slow to crank" },
      { id: "light", label: "Charging / battery light on while driving" },
      { id: "drain", label: "Goes down after parking" },
    ],
  },
  bat_jump: {
    id: "bat_jump",
    question: "Did jump-start bring it back?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, it started" },
      { id: "no", label: "No, still dead" },
      { id: "not_tried", label: "I have not tried" },
    ],
  },
  bat_age: {
    id: "bat_age",
    question: "Is the battery old or newly changed?",
    kind: "choice",
    options: [
      { id: "old", label: "Old (over 2 years)" },
      { id: "new", label: "Newly changed" },
      { id: "unknown", label: "I don’t know" },
    ],
  },
};
