import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const BUFFING_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ BUFFING ------------------------------
  {
    id: "vulc-buff-hand-rasp-set",
    tradeKey: "vulcanizer",
    categorySlug: "tire-buffers",
    subcategorySlug: "hand-rasps",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Hand Rasp Set for Repair Buffing",
    subtitle: "Hand rasps · 3 pcs",
    description:
      "Set of three hand rasps for cleaning and buffing repair areas before patching.",
    sku: "ONA-VULC-BUFF-RASP-003",
    mpn: "RASP-SET-3",
    priceMinor: 260000,
    qty: 70,
    status: "active",
    attributes: { material: "Steel" },
    keywords: ["rasp", "buff", "repair tool"],
    verificationStatus: "source_verified",
  },
];
