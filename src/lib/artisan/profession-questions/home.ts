import type { ProService } from "@/lib/types";
import { bank } from "./bank";
import type { ProfessionQuestion } from "./shared";

export const HOME_PROFESSION_QUESTIONS: Pick<
  Record<ProService, ProfessionQuestion[]>,
  "plumber" | "carpenter" | "painter" | "solar" | "generator"
> = {
  plumber: bank("plumber", [
    {
      id: "plumb_scope",
      label: "What plumbing calls do you take most?",
      type: "multiselect",
      required: true,
      options: [
        "Emergency leaks",
        "Blocked drains",
        "Bathroom & kitchen fittings",
        "Water pumps & heaters",
        "New install / re-pipe",
      ],
      maxSelect: 5,
    },
    {
      id: "plumb_tools",
      label: "Name the main tools you bring to a job",
      type: "text",
      required: true,
      placeholder: "e.g. pipe wrench, plunger set, threader",
    },
  ]),
  carpenter: bank("carpenter", [
    {
      id: "carp_scope",
      label: "What woodwork jobs do you take most?",
      type: "multiselect",
      required: true,
      options: [
        "Doors & frames",
        "Cabinets & wardrobes",
        "Furniture",
        "Roof timber",
        "Shop / office fit-out",
      ],
      maxSelect: 5,
    },
    {
      id: "carp_tools",
      label: "Name the main tools you bring to a job",
      type: "text",
      required: true,
      placeholder: "e.g. circular saw, planer, drill set",
    },
  ]),
  painter: bank("painter", [
    {
      id: "paint_scope",
      label: "What painting jobs do you take most?",
      type: "multiselect",
      required: true,
      options: [
        "Room interiors",
        "Building exteriors",
        "Ceilings",
        "Metal / gates",
        "Full site prep & paint",
      ],
      maxSelect: 5,
    },
    {
      id: "paint_surfaces",
      label: "Which surfaces do you paint regularly?",
      type: "multiselect",
      required: true,
      options: ["Walls", "Ceilings", "Metal", "Wood", "Concrete"],
      maxSelect: 5,
    },
    {
      id: "paint_tools",
      label: "Name the main equipment you use",
      type: "text",
      required: true,
      placeholder: "e.g. rollers, spray gun, ladders",
    },
  ]),
  solar: bank("solar", [
    {
      id: "solar_scope",
      label: "What solar work do you handle day to day?",
      type: "multiselect",
      required: true,
      options: [
        "Home panel install",
        "Inverter setup",
        "Battery systems",
        "Shop / office plant",
        "Maintenance & repair",
      ],
      maxSelect: 5,
    },
    {
      id: "solar_tools",
      label: "Name the main tools and meters you carry",
      type: "text",
      required: true,
      placeholder: "e.g. clamp meter, crimp tools, multimeter",
    },
  ]),
  generator: bank("generator", [
    {
      id: "gen_scope",
      label: "What generator jobs do you take most?",
      type: "multiselect",
      required: true,
      options: [
        "Home petrol gensets",
        "Shop diesel sets",
        "Service & oil change",
        "Major repair",
        "Install & ATS",
      ],
      maxSelect: 5,
    },
    {
      id: "gen_tools",
      label: "Name the main tools you use for genset work",
      type: "text",
      required: true,
      placeholder: "e.g. torque tools, multimeter, load tester",
    },
  ]),
};
