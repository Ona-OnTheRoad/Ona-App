import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const TYRE_LEVERS_TOOLS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ TYRE LEVERS & TOOLS ------------------------------
  {
    id: "vulc-lever-set-30cm",
    tradeKey: "vulcanizer",
    categorySlug: "tire-levers",
    subcategorySlug: "tyre-levers",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Tyre Lever Set 30cm (pair)",
    subtitle: "Forged steel tyre levers · 30cm pair",
    description:
      "Pair of 30 cm forged steel tyre levers for manual demounting.",
    sku: "ONA-VULC-LEVER-30CM-PAIR",
    mpn: "LEVER-30-PAIR",
    priceMinor: 150000,
    qty: 95,
    status: "active",
    attributes: { material: "Steel" },
    keywords: ["lever", "tyre lever", "tool"],
    verificationStatus: "source_verified",
  },
  {
    id: "vulc-mallet-rubber-1kg",
    tradeKey: "vulcanizer",
    categorySlug: "tire-levers",
    subcategorySlug: "mounting-hammers",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Rubber Mallet 1kg",
    subtitle: "Rubber-headed mallet · 1 kg",
    description:
      "1 kg rubber-headed mallet for seating tyre beads during mounting.",
    sku: "ONA-VULC-MALLET-1KG-001",
    mpn: "MALLET-1KG",
    priceMinor: 190000,
    qty: 65,
    status: "active",
    attributes: { material: "Rubber" },
    keywords: ["mallet", "hammer", "mounting"],
    verificationStatus: "source_verified",
  },
];
