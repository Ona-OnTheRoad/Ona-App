import type { ProService } from "@/lib/types";
import { bank } from "./bank";
import { YES_NO, type ProfessionQuestion } from "./shared";

export const AUTO_PROFESSION_QUESTIONS: Pick<
  Record<ProService, ProfessionQuestion[]>,
  | "mechanic"
  | "vulcanizer"
  | "towing"
  | "battery"
  | "ac"
  | "body"
  | "electrical"
  | "diagnostics"
  | "fashion"
> = {
  mechanic: bank("mechanic", [
    {
      id: "mobile_tools",
      label: "Do you arrive with tools ready for the job?",
      hint: "Customers expect you to start work without borrowing their tools.",
      type: "select",
      required: true,
      options: YES_NO,
    },
    {
      id: "vehicle_scope",
      label: "Which vehicles do you handle most days?",
      type: "multiselect",
      required: true,
      options: [
        "Saloon & hatchback",
        "SUV & 4x4",
        "Buses",
        "Light trucks",
        "Motorcycles",
      ],
      maxSelect: 4,
    },
  ]),
  vulcanizer: bank("vulcanizer", [
    {
      id: "has_compressor",
      label: "Do you work with your own air compressor?",
      type: "select",
      required: true,
      options: YES_NO,
    },
    {
      id: "service_mode",
      label: "How do customers usually reach you?",
      type: "select",
      required: true,
      options: ["I come to them (mobile)", "They come to my bay", "Both"],
    },
  ]),
  towing: bank("towing", [
    {
      id: "tow_equipment",
      label: "What do you use for recovery jobs?",
      type: "multiselect",
      required: true,
      options: ["Wheel-lift truck", "Flatbed", "Winch", "Crane assist"],
      maxSelect: 4,
    },
  ]),
  battery: bank("battery", [
    {
      id: "stock_batteries",
      label: "Do you carry replacement batteries on call-outs?",
      type: "select",
      required: true,
      options: YES_NO,
    },
  ]),
  ac: bank("ac", [
    {
      id: "ac_scope",
      label: "Where do you mostly fix AC?",
      type: "multiselect",
      required: true,
      options: ["Cars & buses", "Homes (split units)", "Shops & offices"],
      maxSelect: 3,
    },
    {
      id: "has_gauge_set",
      label: "Do you have gauges and a vacuum pump for gas work?",
      type: "select",
      required: true,
      options: YES_NO,
    },
  ]),
  body: bank("body", [
    {
      id: "body_scope",
      label: "What body jobs are you comfortable taking?",
      type: "multiselect",
      required: true,
      options: ["Dent & panel", "Spray paint", "Bumper repair", "Full respray"],
      maxSelect: 4,
    },
  ]),
  electrical: bank("electrical", [
    {
      id: "electric_scope",
      label: "Where do you mostly work?",
      type: "multiselect",
      required: true,
      options: [
        "Homes & flats",
        "Shops & offices",
        "Vehicles",
        "Phones & gadgets",
      ],
      maxSelect: 3,
    },
  ]),
  diagnostics: bank("diagnostics", [
    {
      id: "scan_tools",
      label: "Which scan tool do you use on the job?",
      type: "text",
      required: true,
      placeholder: "e.g. Launch X431, Autel, dealer laptop",
    },
    {
      id: "scan_scope",
      label: "What systems do you diagnose?",
      type: "multiselect",
      required: true,
      options: [
        "Engine / ECU",
        "ABS & brakes",
        "Airbag",
        "Transmission",
        "Full health check",
      ],
      maxSelect: 5,
    },
  ]),
  fashion: bank("fashion", [
    {
      id: "fashion_scope",
      label: "What fashion work do you do most?",
      type: "multiselect",
      required: true,
      options: [
        "Bespoke tailoring",
        "Alterations",
        "Bridal wear",
        "Native wear",
        "Embroidery",
      ],
      maxSelect: 3,
    },
  ]),
};
