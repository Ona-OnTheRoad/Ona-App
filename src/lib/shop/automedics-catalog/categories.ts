export const AUTOMEDICS_CATEGORIES = [
  { slug: "batteries", name: "Batteries" },
  { slug: "engine-oil", name: "Engine Oil" },
  { slug: "transmission-fluid", name: "Transmission Fluid" },
  { slug: "brake-fluid", name: "Brake Fluid" },
  { slug: "coolant", name: "Coolant" },
  { slug: "oil-filters", name: "Oil Filters" },
  { slug: "air-filters", name: "Air Filters" },
  { slug: "cabin-filters", name: "Cabin Filters" },
  { slug: "brake-pads", name: "Brake Pads" },
  { slug: "brake-discs", name: "Brake Discs" },
  { slug: "brake-linings", name: "Brake Linings" },
  { slug: "shock-absorbers", name: "Shock Absorbers" },
  { slug: "ball-joints", name: "Ball Joints" },
  { slug: "stabilizer-linkages", name: "Stabilizer Linkages" },
  {
    slug: "stabilizer-rubbers-bushings",
    name: "Stabilizer Rubbers & Bushings",
  },
  { slug: "tie-rod-ends-sockets", name: "Tie Rod Ends & Sockets" },
  { slug: "other-accessories", name: "Other / Accessories" },
] as const;

export type AutomedicsCategorySlug =
  (typeof AUTOMEDICS_CATEGORIES)[number]["slug"];
