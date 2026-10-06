import type { ProService } from "@/lib/types";

export type ArtisanTradeDef = {
  service: ProService;
  label: string;
  homeLabel: string;
  description: string;
  /** Sub-categories required on signup / onboarding */
  specialties: string[];
};

export const ARTISAN_TRADE_CATALOG: ArtisanTradeDef[] = [
  {
    service: "mechanic",
    label: "Mechanic",
    homeLabel: "Mechanic",
    description: "Engine, brakes and general auto repair",
    specialties: [
      "General Mechanic",
      "Engine Specialist",
      "Brakes & Suspension",
      "Roadside Mechanic",
      "Workshop Mechanic",
    ],
  },
  {
    service: "vulcanizer",
    label: "Vulcanizer",
    homeLabel: "Vulcanizer",
    description: "Tyres, tubes and balancing",
    specialties: [
      "Roadside Vulcanizing",
      "Workshop Vulcanizing",
      "Fleet / Commercial Tyres",
    ],
  },
  {
    service: "towing",
    label: "Tow",
    homeLabel: "Tow",
    description: "Tow and recovery",
    specialties: [
      "Light Tow",
      "Heavy Recovery",
      "Accident Recovery",
      "Highway Assist",
    ],
  },
  {
    service: "battery",
    label: "Battery",
    homeLabel: "Battery",
    description: "Jump start, change battery, charge",
    specialties: [
      "Jump Start",
      "Battery Replacement",
      "Charging System",
      "Home / Inverter Batteries",
    ],
  },
  {
    service: "ac",
    label: "A/C",
    homeLabel: "A/C",
    description: "Vehicle, home, commercial and industrial cooling",
    specialties: ["Vehicle", "Residential (Homes)", "Commercial", "Industrial"],
  },
  {
    service: "body",
    label: "Body",
    homeLabel: "Body",
    description: "Dent, panel beat and paint",
    specialties: [
      "Panel Beating",
      "Spray Painting",
      "Dent Repair",
      "Full Body Shop",
    ],
  },
  {
    service: "electrical",
    label: "Electric",
    homeLabel: "Electric",
    description: "Vehicle, home, commercial, industrial and electronics",
    specialties: [
      "Vehicle",
      "Residential (Homes)",
      "Commercial",
      "Industrial",
      "Electronics",
      "Mobile",
    ],
  },
  {
    service: "diagnostics",
    label: "Scan",
    homeLabel: "Scan",
    description: "Digital health check for vehicles",
    specialties: [
      "OBD Scan",
      "Full Vehicle Health Check",
      "Coding & Programming",
    ],
  },
  {
    service: "fashion",
    label: "Fashion",
    homeLabel: "Fashion",
    description: "Fashion design and tailoring",
    specialties: [
      "Bespoke Tailoring",
      "Bridal & Event Wear",
      "Native / Traditional Wear",
      "Corporate & Uniforms",
      "Alterations",
    ],
  },
  {
    service: "plumber",
    label: "Plumber",
    homeLabel: "Plumber",
    description: "Homes, offices, commercial and industrial",
    specialties: [
      "Residential (Homes)",
      "Offices",
      "Commercial Plumbing",
      "Industrial Plumbing",
    ],
  },
  {
    service: "carpenter",
    label: "Carpenter",
    homeLabel: "Carpenter",
    description: "Homes, offices, industrial and commercial",
    specialties: [
      "Residential (Homes)",
      "Offices",
      "Commercial Carpentry",
      "Industrial Carpentry",
      "Furniture & Fit-out",
    ],
  },
  {
    service: "painter",
    label: "Painter",
    homeLabel: "Painter",
    description: "Homes, offices, industrial and commercial",
    specialties: [
      "Residential (Homes)",
      "Offices",
      "Commercial Painting",
      "Industrial Painting",
      "Exterior / Facade",
    ],
  },
  {
    service: "solar",
    label: "Solar",
    homeLabel: "Solar",
    description: "Homes, offices, industrial and commercial",
    specialties: [
      "Residential (Homes)",
      "Offices",
      "Commercial Solar",
      "Industrial Solar",
    ],
  },
  {
    service: "generator",
    label: "Generator",
    homeLabel: "Generator",
    description: "Homes, offices, commercial and industrial",
    specialties: [
      "Residential (Homes)",
      "Offices",
      "Commercial Generators",
      "Industrial Generators",
    ],
  },
];
