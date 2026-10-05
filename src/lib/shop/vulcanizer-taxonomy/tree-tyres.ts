import type { VulcCat } from "@/lib/shop/vulcanizer-taxonomy";

export const VULCANIZER_TYRE_CATEGORIES: VulcCat[] = [
  {
    slug: "tires",
    name: "Tires & Tyres",
    children: [
      { slug: "passenger-tires", name: "Passenger Car Tyres" },
      { slug: "touring-tires", name: "Touring Tyres" },
      { slug: "performance-tires", name: "Performance Tyres" },
      { slug: "run-flat-tires", name: "Run-Flat Tyres" },
      { slug: "all-season-tires", name: "All-Season Tyres" },
      { slug: "winter-tires", name: "Winter / Snow Tyres" },
      { slug: "spare-temporary-tires", name: "Temporary / Space-Saver Spares" },
    ],
  },
  {
    slug: "truck-bus-tires",
    name: "Truck & Bus Tyres",
    children: [
      { slug: "light-truck-tires", name: "Light-Truck (LT) Tyres" },
      { slug: "bus-tires", name: "Bus Tyres" },
      { slug: "truck-tires", name: "Rigid Truck Tyres" },
      { slug: "trailer-tires", name: "Trailer Tyres" },
    ],
  },
  {
    slug: "motorcycle-tires",
    name: "Motorcycle & Scooter Tyres",
    children: [
      { slug: "motorcycle-front-tires", name: "Motorcycle Front Tyres" },
      { slug: "motorcycle-rear-tires", name: "Motorcycle Rear Tyres" },
      { slug: "scooter-tires", name: "Scooter Tyres" },
      { slug: "motocross-tires", name: "Motocross / Dirt Tyres" },
    ],
  },
  {
    slug: "bicycle-tires",
    name: "Bicycle Tyres",
    children: [
      { slug: "road-bike-tires", name: "Road Bike Tyres" },
      { slug: "mountain-bike-tires", name: "Mountain Bike Tyres" },
      { slug: "city-bike-tires", name: "City / Commuter Tyres" },
      { slug: "kart-tires", name: "Go-Kart Tyres" },
    ],
  },
  {
    slug: "speciality-tires",
    name: "Speciality & Off-Road Tyres",
    children: [
      { slug: "all-terrain-tires", name: "All-Terrain Tyres" },
      { slug: "mud-terrain-tires", name: "Mud-Terrain Tyres" },
      { slug: "agricultural-tires", name: "Agricultural / Tractor Tyres" },
      { slug: "industrial-tires", name: "Industrial & Forklift Tyres" },
      { slug: "solid-tires", name: "Solid / Puncture-Proof Tyres" },
    ],
  },
  {
    slug: "tubes",
    name: "Inner Tubes",
    children: [
      { slug: "passenger-tubes", name: "Passenger Car Tubes" },
      { slug: "truck-tubes", name: "Truck & Bus Tubes" },
      { slug: "motorcycle-tubes", name: "Motorcycle / Scooter Tubes" },
      { slug: "bicycle-tubes", name: "Bicycle Tubes" },
      { slug: "r20-r24-tubes", name: "Heavy-Duty (R20-R24) Tubes" },
    ],
  },
  {
    slug: "rims",
    name: "Rims & Alloy Wheels",
    children: [
      { slug: "steel-rims", name: "Steel Rims" },
      { slug: "alloy-rims", name: "Alloy Rims" },
      { slug: "white-rims", name: "White / Spider Rims" },
      { slug: "heavy-duty-rims", name: "Heavy-Duty Rims" },
      { slug: "split-rim-parts", name: "Split Rim Parts" },
    ],
  },
  {
    slug: "wheels",
    name: "Complete Wheels",
    children: [
      { slug: "steel-wheel-assemblies", name: "Steel Wheel Assemblies" },
      { slug: "alloy-wheel-assemblies", name: "Alloy Wheel Assemblies" },
      { slug: "spare-wheel-assemblies", name: "Spare Wheel Assemblies" },
      { slug: "wheel-covers", name: "Wheel Covers & Trims" },
    ],
  },
  {
    slug: "hub-caps-accessories",
    name: "Hub Caps & Wheel Accessories",
    children: [
      { slug: "hub-caps", name: "Hub Caps" },
      { slug: "center-caps", name: "Centre Caps" },
      { slug: "wheel-center-covers", name: "Wheel Centre Covers" },
      { slug: "wheel-spacers", name: "Wheel Spacers" },
    ],
  },
  {
    slug: "tires-fasteners",
    name: "Wheel Nuts, Studs & Hardware",
    children: [
      { slug: "lug-nuts", name: "Lug Nuts" },
      { slug: "wheel-studs", name: "Wheel Studs" },
      { slug: "locking-nuts", name: "Locking Nuts" },
      { slug: "wheel-hardware-kits", name: "Wheel Hardware Kits" },
    ],
  },
  {
    slug: "valves",
    name: "Valves & Valve Cores",
    children: [
      { slug: "snap-in-valves", name: "Snap-In Tyre Valves" },
      { slug: "clamp-in-valves", name: "Clamp-In / Metal Valves" },
      { slug: "valve-cores", name: "Valve Cores" },
      { slug: "valve-caps", name: "Valve Caps" },
      { slug: "valve-extenders", name: "Valve Extenders" },
      { slug: "tpms-valves", name: "TPMS Valves" },
    ],
  },
  {
    slug: "tpms",
    name: "TPMS & Sensors",
    children: [
      { slug: "tpms-sensors", name: "TPMS Sensors" },
      { slug: "tpms-service-kits", name: "TPMS Service Kits" },
      { slug: "tpms-tools", name: "TPMS Tools" },
      { slug: "programmable-sensors", name: "Programmable Sensors" },
    ],
  },
  {
    slug: "patches",
    name: "Repair Patches & Plugs",
    children: [
      { slug: "hot-patches", name: "Hot Patches" },
      { slug: "cold-patches", name: "Cold Patches" },
      { slug: "radial-repair-patches", name: "Radial Repair Patches" },
      { slug: "tube-patches", name: "Tube Patches" },
      { slug: "tire-plugs", name: "Tyre Plugs & Strings" },
    ],
  },
  {
    slug: "tire-repair",
    name: "Tyre Repair Kits & Tools",
    children: [
      { slug: "puncture-repair-kits", name: "Puncture Repair Kits" },
      { slug: "diagonal-repair-kits", name: "Diagonal Repair Kits" },
      { slug: "section-repair-kits", name: "Section Repair Kits" },
      { slug: "repair-tools", name: "Repair Tools" },
    ],
  },
  {
    slug: "tubeless-sealant",
    name: "Tubeless Conversion & Sealant",
    children: [
      { slug: "tubeless-conversion-kits", name: "Tubeless Conversion Kits" },
      { slug: "tubeless-sealant", name: "Tubeless Sealant" },
      { slug: "rim-tape", name: "Rim Tape" },
      { slug: "bead-seat-sealant", name: "Bead Seat Sealant" },
    ],
  },
  {
    slug: "vulcanizing-materials",
    name: "Vulcanizing Materials",
    children: [
      { slug: "vulcanizing-cement", name: "Vulcanizing Cement" },
      { slug: "cushion-gum", name: "Cushion Gum" },
      { slug: "repair-gum", name: "Repair Gum" },
      { slug: "uncured-rubber", name: "Uncured Rubber Sheets" },
      { slug: "chemical-vulcanizing", name: "Chemical Vulcanizing Fluid" },
    ],
  },
];
