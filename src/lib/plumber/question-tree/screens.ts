import { PLUMBER_START_QUESTION } from "./constants";
import { PLUMBER_START_OPTIONS } from "./options";
import type { PlumberScreen } from "./types";

export const PLUMBER_SCREENS: Record<string, PlumberScreen> = {
  start: {
    question: PLUMBER_START_QUESTION,
    kind: "choice",
    options: PLUMBER_START_OPTIONS,
  },

  // Branch A no water or very low water pressure
  a_flow: {
    question: "Is there completely no water, or is the pressure just very low?",
    kind: "choice",
    options: [
      { id: "completely-none", label: "Completely no water" },
      { id: "very-low", label: "Pressure is just very low" },
      { id: "both", label: "Both / it changes" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  a_area: {
    question:
      "Is the problem affecting the whole house or only certain areas (kitchen, bathroom, upstairs, etc.)?",
    kind: "choice",
    options: [
      { id: "whole-house", label: "Whole house" },
      { id: "certain-areas", label: "Only certain areas" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  a_supply: {
    question: "Do you use a borehole, well, or public water supply?",
    kind: "choice",
    options: [
      { id: "borehole", label: "Borehole" },
      { id: "well", label: "Well" },
      { id: "public", label: "Public water supply" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  a_tank: {
    question: "Do you have an overhead tank or pressure pump?",
    kind: "choice",
    options: [
      { id: "overhead-tank", label: "Overhead tank" },
      { id: "pressure-pump", label: "Pressure pump" },
      { id: "both", label: "Both" },
      { id: "neither", label: "Neither" },
    ],
  },
  a_pump: {
    question: "If you use a pump, what is it doing?",
    kind: "choice",
    options: [
      { id: "no-pump", label: "I don't use a pump" },
      { id: "not-running", label: "Not starting at all" },
      { id: "humming", label: "Humming or running but no water comes out" },
      { id: "weak", label: "Running but the pressure is weak" },
      { id: "trips", label: "Keeps tripping or switching off" },
    ],
  },
  a_tankwater: {
    question: "Is there water in the overhead tank or storage?",
    kind: "choice",
    options: [
      { id: "full", label: "Yes, it has water" },
      { id: "empty", label: "No, it is empty" },
      { id: "no-tank", label: "I have no tank" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  a_started: {
    question: "When did the problem start?",
    kind: "choice",
    options: [
      { id: "today", label: "Today" },
      { id: "days", label: "In the last few days" },
      { id: "week-plus", label: "More than a week ago" },
      { id: "gradual", label: "It has been getting worse slowly" },
    ],
  },

  // Branch B water leakage
  b_source: {
    question: "Where is the leakage coming from?",
    kind: "choice",
    options: [
      { id: "tap-mixer", label: "Tap or mixer" },
      { id: "pipe", label: "Pipe (visible or inside wall/ceiling)" },
      { id: "cistern-base", label: "Toilet cistern or base" },
      { id: "water-heater", label: "Water heater" },
      { id: "tank-underground", label: "Overhead tank or underground pipe" },
      { id: "other", label: "Other" },
    ],
  },
  b_flow: {
    question: "Is the leak slow dripping or strong flowing?",
    kind: "choice",
    options: [
      { id: "slow-dripping", label: "Slow dripping" },
      { id: "strong-flowing", label: "Strong flowing" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  b_shutoff: {
    question: "Have you been able to stop the water?",
    kind: "choice",
    options: [
      { id: "stopped", label: "Yes, I closed a valve or the main" },
      { id: "no-valve", label: "I can't find the valve" },
      { id: "cant-stop", label: "I tried but it will not stop" },
      { id: "not-yet", label: "Not yet" },
    ],
  },
  b_damage: {
    question: "Is water currently damaging the floor, wall, or ceiling?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  b_exact: {
    question: "Can you see the exact source of the leak?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },

  // Branch C blocked drain, sink, or toilet
  c_blocked: {
    question: "What is blocked?",
    kind: "choice",
    options: [
      { id: "kitchen-sink", label: "Kitchen sink" },
      { id: "bathroom-sink", label: "Bathroom sink" },
      { id: "shower-drain", label: "Shower drain" },
      { id: "toilet", label: "Toilet" },
      { id: "floor-drain", label: "Floor drain / gully" },
      { id: "outdoor-drain", label: "Main outdoor drain" },
    ],
  },
  c_backup: {
    question: "Is water backing up or overflowing?",
    kind: "choice",
    options: [
      { id: "backing-up", label: "Water is backing up" },
      { id: "overflowing", label: "Water is overflowing" },
      { id: "no", label: "No" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  c_other: {
    question: "What else do you notice?",
    kind: "choice",
    options: [
      { id: "only-this", label: "Only this one is blocked" },
      { id: "others-slow", label: "Other drains are slow too" },
      { id: "gurgling", label: "Gurgling sounds from drains" },
      { id: "smell", label: "A bad sewage smell" },
    ],
  },
  c_tried: {
    question:
      "Have you already tried any chemical or local method to clear it?",
    kind: "choice",
    options: [
      { id: "yes-chemical", label: "Yes, chemicals" },
      { id: "yes-local", label: "Yes, a local method" },
      { id: "no", label: "No" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  c_howlong: {
    question: "How long has it been blocked?",
    kind: "choice",
    options: [
      { id: "today", label: "Since today" },
      { id: "days", label: "A few days" },
      { id: "week-plus", label: "More than a week" },
      { id: "recurring", label: "It keeps coming back" },
    ],
  },

  // Branch D faulty or damaged tap / shower / mixer
  d_what: {
    question: "What exactly is wrong?",
    kind: "choice",
    options: [
      { id: "tap-leaking", label: "Tap is leaking" },
      { id: "tap-loose-broken", label: "Tap is loose or broken" },
      { id: "tap-no-water", label: "No water coming out of the tap" },
      { id: "shower-not-working", label: "Shower not working properly" },
      {
        id: "mixer-hot-cold",
        label: "Mixer not controlling hot/cold correctly",
      },
    ],
  },
  d_mount: {
    question: "Is it a wall-mounted, standing, or sensor tap?",
    kind: "choice",
    options: [
      { id: "wall-mounted", label: "Wall-mounted" },
      { id: "standing", label: "Standing" },
      { id: "sensor", label: "Sensor tap" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  d_water: {
    question: "Which water is affected?",
    kind: "choice",
    options: [
      { id: "cold", label: "Cold water only" },
      { id: "hot", label: "Hot water only" },
      { id: "both", label: "Both hot and cold" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  d_fix: {
    question: "Do you want repair or complete replacement?",
    kind: "choice",
    options: [
      { id: "repair", label: "Repair" },
      { id: "replacement", label: "Complete replacement" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch E water heater / geyser problem
  e_issue: {
    question: "What is the issue?",
    kind: "choice",
    options: [
      { id: "not-heating", label: "Not heating at all" },
      { id: "heating-slowly", label: "Heating too slowly" },
      { id: "leaking", label: "Leaking" },
      { id: "unusual-noise", label: "Making unusual noise" },
      { id: "tripping-dead", label: "Tripping electricity or completely dead" },
    ],
  },
  e_type: {
    question: "Is it an electric geyser, gas geyser, or solar water heater?",
    kind: "choice",
    options: [
      { id: "electric", label: "Electric geyser" },
      { id: "gas", label: "Gas geyser" },
      { id: "solar", label: "Solar water heater" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  e_power: {
    question: "Does the unit have its energy supply?",
    kind: "choice",
    options: [
      { id: "on", label: "Yes, it is on, but still not right" },
      { id: "off", label: "No, the light is off or it is dead" },
      { id: "trips", label: "It trips the breaker when switched on" },
      { id: "gas-smell", label: "I smell gas (do not use it)" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  e_age: {
    question: "How old is the unit (if known)?",
    kind: "choice",
    options: [
      { id: "under-2", label: "Under 2 years" },
      { id: "2-5", label: "2 - 5 years" },
      { id: "over-5", label: "Over 5 years" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch F toilet flushing problem
  f_happening: {
    question: "What is happening?",
    kind: "choice",
    options: [
      { id: "not-flushing", label: "Toilet not flushing at all" },
      { id: "weak-flush", label: "Weak flush" },
      {
        id: "cistern-running",
        label: "Continuous running water in the cistern",
      },
      { id: "cistern-leaking", label: "Cistern leaking" },
      { id: "handle-broken", label: "Handle or button broken" },
    ],
  },
  f_refill: {
    question: "Does the cistern fill with water?",
    kind: "choice",
    options: [
      { id: "fills", label: "Yes, it fills normally" },
      { id: "slow", label: "It fills very slowly" },
      { id: "no-fill", label: "It does not fill at all" },
      { id: "overflows", label: "It keeps filling and overflowing" },
    ],
  },
  f_cistern: {
    question: "Is it a wash-down, dual-flush, or old-style cistern?",
    kind: "choice",
    options: [
      { id: "wash-down", label: "Wash-down" },
      { id: "dual-flush", label: "Dual-flush" },
      { id: "old-style", label: "Old-style cistern" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch G new installation or complete plumbing work
  g_install: {
    question: "What do you need installed or done?",
    kind: "choice",
    options: [
      { id: "tap-sink-shower", label: "New tap, sink, or shower" },
      { id: "full-bathroom", label: "Complete bathroom plumbing" },
      { id: "kitchen", label: "Kitchen plumbing" },
      { id: "overhead-tank-pipes", label: "Overhead tank and piping" },
      {
        id: "borehole-pump",
        label: "Borehole connection or pump installation",
      },
      { id: "full-repipe", label: "Full house re-piping" },
    ],
  },
  g_scope: {
    question: "How many fixtures or rooms are involved?",
    kind: "choice",
    options: [
      { id: "one", label: "One fixture or room" },
      { id: "2-3", label: "2 - 3 fixtures or rooms" },
      { id: "4-plus", label: "4 or more" },
      { id: "whole", label: "The whole property" },
    ],
  },
  g_building: {
    question: "Is the building new, under renovation, or existing?",
    kind: "choice",
    options: [
      { id: "new", label: "New" },
      { id: "renovation", label: "Under renovation" },
      { id: "existing", label: "Existing" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  g_materials: {
    question: "Who is supplying the pipes and fittings?",
    kind: "choice",
    options: [
      { id: "i-will", label: "I will buy them" },
      { id: "plumber", label: "The plumber should supply them" },
      { id: "not-sure", label: "I'm not sure, advise me" },
    ],
  },
  // Branch H something else / not sure
  h_describe: {
    question: "Please describe the plumbing problem in your own words.",
    kind: "text",
    placeholder: "Describe what you’re experiencing…",
  },
  h_area: {
    question: "Which area of the house or property is affected?",
    kind: "choice",
    options: [
      { id: "kitchen", label: "Kitchen" },
      { id: "bathroom", label: "Bathroom or toilet" },
      { id: "outside", label: "Outside or compound" },
      { id: "tank-roof", label: "Tank or roof" },
      { id: "whole", label: "The whole property" },
    ],
  },
  h_when: {
    question: "When did you first notice it?",
    kind: "choice",
    options: [
      { id: "today", label: "Today" },
      { id: "days", label: "In the last few days" },
      { id: "week-plus", label: "More than a week ago" },
    ],
  },
};
