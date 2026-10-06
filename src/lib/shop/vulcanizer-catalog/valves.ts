import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const VALVES_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ VALVES ------------------------------
  {
    id: "vulc-valve-snapin-tr412",
    tradeKey: "vulcanizer",
    categorySlug: "valves",
    subcategorySlug: "snap-in-valves",
    brand: { slug: "schrader", name: "Schrader" },
    name: "Schrader TR412 Snap-In Tyre Valve (pack of 10)",
    subtitle: "Rubber snap-in valve · TR412 · 10 pcs",
    description:
      "Standard rubber snap-in tubeless valve TR412. Always fit a new valve when fitting a new tubeless tyre.",
    sku: "ONA-VULC-VLV-TR412-010",
    mpn: "TR412",
    priceMinor: 150000,
    qty: 200,
    status: "active",
    attributes: { material: "Rubber" },
    keywords: ["valve", "tyre valve", "snap-in", "tr412"],
    verificationStatus: "source_verified",
  },
  {
    id: "vulc-valve-core-tool-kit",
    tradeKey: "vulcanizer",
    categorySlug: "valves",
    subcategorySlug: "valve-cores",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Valve Core Tool + 25 valve cores",
    subtitle: "Valve core remover tool · 25 cores",
    description:
      "Valve core removal tool with a pack of 25 brass valve cores a staple on every vulcanizer bench.",
    sku: "ONA-VULC-VLV-CORE-025",
    mpn: "VLV-CORE-KIT",
    priceMinor: 250000,
    qty: 60,
    status: "active",
    attributes: { material: "Brass" },
    keywords: ["valve", "valve core", "core tool"],
    verificationStatus: "source_verified",
  },
];
