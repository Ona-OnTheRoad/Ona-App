import type { AutomedicsCategorySlug } from "@/lib/shop/automedics-catalog/categories";

export type AutomedicsProduct = {
  sku: string;
  name: string;
  categorySlug: AutomedicsCategorySlug;
  /** Naira major units. null = contact for price. */
  priceMajor: number | null;
  vehicle: string;
  brand: string;
  imageKey: string;
  keywords: string[];
};

const CAT_IMAGE: Record<AutomedicsCategorySlug, string> = {
  batteries: "battery",
  "engine-oil": "engine-oil-5l",
  "transmission-fluid": "transmission-fluid",
  "brake-fluid": "brake-fluid",
  coolant: "coolant-green",
  "oil-filters": "oil-filter",
  "air-filters": "air-filter",
  "cabin-filters": "cabin-filter",
  "brake-pads": "brake-pads",
  "brake-discs": "brake-disc",
  "brake-linings": "brake-lining",
  "shock-absorbers": "shock-absorber",
  "ball-joints": "ball-joint",
  "stabilizer-linkages": "stabilizer-link",
  "stabilizer-rubbers-bushings": "bushing",
  "tie-rod-ends-sockets": "tie-rod",
  "other-accessories": "radiator-cap",
};

function tokens(name: string, vehicle: string, extra: string[] = []): string[] {
  const bag = new Set<string>();
  for (const w of `${name} ${vehicle}`.toLowerCase().split(/[^a-z0-9+]+/)) {
    if (w.length >= 2) bag.add(w);
  }
  for (const e of extra) bag.add(e.toLowerCase());
  return [...bag];
}

export function p(
  sku: string,
  name: string,
  categorySlug: AutomedicsCategorySlug,
  priceMajor: number | null,
  vehicle: string,
  brand = "Automedics",
  imageKey?: string,
): AutomedicsProduct {
  return {
    sku,
    name,
    categorySlug,
    priceMajor,
    vehicle,
    brand,
    imageKey: imageKey || CAT_IMAGE[categorySlug],
    keywords: tokens(name, vehicle, [brand, categorySlug.replace(/-/g, " ")]),
  };
}
