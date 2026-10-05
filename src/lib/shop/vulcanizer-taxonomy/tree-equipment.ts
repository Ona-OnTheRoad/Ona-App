import type { VulcCat } from "@/lib/shop/vulcanizer-taxonomy";

export const VULCANIZER_EQUIPMENT_CATEGORIES: VulcCat[] = [
  {
    slug: "vulcanizing-equipment",
    name: "Vulcanizing Equipment",
    children: [
      { slug: "vulcanizing-machines", name: "Vulcanizing Machines" },
      { slug: "heat-curing-pads", name: "Heat / Curing Pads" },
      { slug: "vulcanizing-presses", name: "Vulcanizing Presses" },
      { slug: "spot-vulcanizers", name: "Spot Vulcanizers" },
      { slug: "autoclaves", name: "Autoclaves / Chambers" },
    ],
  },
  {
    slug: "tire-changers",
    name: "Tyre Changers & Dismantling",
    children: [
      { slug: "manual-tire-changers", name: "Manual Tyre Changers" },
      { slug: "semi-auto-tire-changers", name: "Semi-Automatic Tyre Changers" },
      { slug: "automatic-tire-changers", name: "Automatic Tyre Changers" },
      { slug: "truck-tire-changers", name: "Truck / Bus Tyre Changers" },
      { slug: "tire-changer-accessories", name: "Tyre Changer Accessories" },
    ],
  },
  {
    slug: "bead-breakers",
    name: "Bead Breakers",
    children: [
      { slug: "manual-bead-breakers", name: "Manual Bead Breakers" },
      { slug: "hydraulic-bead-breakers", name: "Hydraulic Bead Breakers" },
      { slug: "bead-breaker-kits", name: "Bead Breaker Kits" },
    ],
  },
  {
    slug: "compressors",
    name: "Air Compressors",
    children: [
      { slug: "portable-compressors", name: "Portable Compressors" },
      { slug: "garage-compressors", name: "Garage / Shop Compressors" },
      { slug: "twin-cylinder-compressors", name: "Twin-Cylinder Compressors" },
      { slug: "diesel-compressors", name: "Diesel Compressors" },
      { slug: "compressor-spares", name: "Compressor Spares" },
    ],
  },
  {
    slug: "air-accessories",
    name: "Air Systems & Fittings",
    children: [
      { slug: "air-hoses", name: "Air Hoses" },
      { slug: "air-chucks", name: "Air Chucks" },
      { slug: "air-couplers", name: "Quick Couplers & Fittings" },
      { slug: "air-regulators", name: "Regulators & Moisture Traps" },
      { slug: "air-tanks", name: "Air Tanks" },
    ],
  },
  {
    slug: "tire-inflation",
    name: "Inflation & Pressure Gauges",
    children: [
      { slug: "tyre-pressure-gauges", name: "Tyre Pressure Gauges" },
      { slug: "digital-inflators", name: "Digital Inflators" },
      { slug: "foot-pumps", name: "Foot Pumps" },
      { slug: "portable-inflators", name: "Portable / 12V Inflators" },
      { slug: "air-guns", name: "Pneumatic Air Guns" },
    ],
  },
  {
    slug: "balancing",
    name: "Wheel Balancing",
    children: [
      { slug: "wheel-balancers", name: "Wheel Balancers" },
      { slug: "wheel-balancer-accessories", name: "Balancer Accessories" },
      { slug: "balancing-cones", name: "Balancing Cones" },
      { slug: "wheel-balancers-semi", name: "Semi-Automatic Balancers" },
    ],
  },
  {
    slug: "balance-weights",
    name: "Balance Weights",
    children: [
      { slug: "adhesive-weights", name: "Adhesive Weights" },
      { slug: "hammer-on-weights", name: "Hammer-On Weights" },
      { slug: "balance-weight-kits", name: "Weight Kits" },
      { slug: "balance-beads", name: "Balancing Beads" },
    ],
  },
  {
    slug: "alignment",
    name: "Wheel Alignment",
    children: [
      { slug: "alignment-gauges", name: "Alignment Gauges" },
      { slug: "camber-kits", name: "Camber / Caster Kits" },
      { slug: "toe-gauges", name: "Toe Gauges" },
      { slug: "laser-alignment-systems", name: "Laser Alignment Systems" },
      { slug: "alignment-accessories", name: "Alignment Accessories" },
    ],
  },
  {
    slug: "tire-levers",
    name: "Tyre Levers & Mounting Tools",
    children: [
      { slug: "tyre-levers", name: "Tyre Levers" },
      { slug: "bead-tools", name: "Bead Tools" },
      { slug: "mounting-hammers", name: "Rubber Mallets & Hammers" },
      { slug: "tyre-spoons", name: "Tyre Spoons" },
      { slug: "socket-sets", name: "Wheel Socket Sets" },
    ],
  },
  {
    slug: "tire-buffers",
    name: "Buffing & Grinding",
    children: [
      { slug: "tire-buffing-machines", name: "Buffing Machines" },
      { slug: "hand-rasps", name: "Hand Rasps" },
      { slug: "grinder-wheels", name: "Grinder Wheels" },
      { slug: "wire-brushes", name: "Wire Brushes" },
      { slug: "power-buffers", name: "Power Buffers" },
    ],
  },
  {
    slug: "power-tools",
    name: "Power Tools",
    children: [
      { slug: "impact-wrenches", name: "Impact Wrenches" },
      { slug: "angle-grinders", name: "Angle Grinders" },
      { slug: "portable-drills", name: "Portable Drills" },
      { slug: "air-tools", name: "Air Tools" },
      { slug: "battery-chargers", name: "Chargers & Batteries" },
    ],
  },
  {
    slug: "garage-equipment",
    name: "Garage & Lifting Equipment",
    children: [
      { slug: "trolley-jacks", name: "Trolley Jacks" },
      { slug: "bottle-jacks", name: "Bottle Jacks" },
      { slug: "axle-stands", name: "Axle Stands" },
      { slug: "creepers", name: "Creepers" },
      { slug: "work-benches", name: "Work Benches" },
      { slug: "wheel-chocks", name: "Wheel Chocks" },
    ],
  },
  {
    slug: "tire-care-chemicals",
    name: "Tyre Care & Chemicals",
    children: [
      { slug: "tyre-dressing", name: "Tyre Dressing" },
      { slug: "tyre-shine", name: "Tyre Shine" },
      { slug: "bead-lubricant", name: "Bead Lubricant / Mounting Paste" },
      { slug: "degreasers", name: "Degreasers & Cleaners" },
      { slug: "leak-detector", name: "Puncture / Leak Detection Spray" },
    ],
  },
  {
    slug: "safety-ppe",
    name: "Safety & PPE",
    children: [
      { slug: "safety-gloves", name: "Safety Gloves" },
      { slug: "safety-glasses", name: "Safety Glasses" },
      { slug: "ear-protection", name: "Ear Protection" },
      { slug: "aprons", name: "Aprons & Coveralls" },
      { slug: "first-aid", name: "First-Aid Supplies" },
    ],
  },
];
