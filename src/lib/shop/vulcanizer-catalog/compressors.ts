import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const COMPRESSORS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ COMPRESSORS ------------------------------
  {
    id: "vulc-comp-50l-single",
    tradeKey: "vulcanizer",
    categorySlug: "compressors",
    subcategorySlug: "garage-compressors",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Air Compressor 50L 1.5HP",
    subtitle: "50-litre single-cylinder compressor · 1.5 HP",
    description:
      "50-litre single-cylinder air compressor, 1.5 HP, for tyre inflation and air tools.",
    sku: "ONA-VULC-CMP-50L-15HP",
    mpn: "CMP-50L-1.5",
    priceMinor: 2450000,
    qty: 9,
    status: "active",
    attributes: { voltage: 220, capacity: 50, powerW: 1100 },
    keywords: ["compressor", "air", "inflation"],
    verificationStatus: "pending",
  },
  {
    id: "vulc-comp-100l-twin",
    tradeKey: "vulcanizer",
    categorySlug: "compressors",
    subcategorySlug: "twin-cylinder-compressors",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Twin-Cylinder Compressor 100L 3HP",
    subtitle: "100-litre twin-cylinder compressor · 3 HP",
    description:
      "100-litre twin-cylinder compressor, 3 HP, for heavy workshop use.",
    sku: "ONA-VULC-CMP-100L-3HP",
    mpn: "CMP-100L-3",
    priceMinor: 4250000,
    qty: 4,
    status: "future_product",
    attributes: { voltage: 220, capacity: 100, powerW: 2200 },
    keywords: ["compressor", "air", "twin cylinder"],
    verificationStatus: "pending",
  },
];
