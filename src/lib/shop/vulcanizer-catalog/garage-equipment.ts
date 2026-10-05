import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const GARAGE_EQUIPMENT_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ GARAGE EQUIPMENT ------------------------------
  {
    id: "vulc-jack-3t-trolley",
    tradeKey: "vulcanizer",
    categorySlug: "garage-equipment",
    subcategorySlug: "trolley-jacks",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro 3-Ton Trolley Jack",
    subtitle: "3-ton hydraulic trolley jack",
    description:
      "3-ton hydraulic trolley jack with lifting range for passenger and light trucks.",
    sku: "ONA-VULC-JACK-3T-001",
    mpn: "JACK-3T",
    priceMinor: 2350000,
    qty: 0,
    status: "discontinued",
    attributes: { capacity: 3000, material: "Steel" },
    keywords: ["jack", "trolley", "hydraulic"],
    verificationStatus: "source_verified",
  },
  {
    id: "vulc-stand-pair-3t",
    tradeKey: "vulcanizer",
    categorySlug: "garage-equipment",
    subcategorySlug: "axle-stands",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Axle Stands (pair, 3-ton)",
    subtitle: "Adjustable axle stands · 3-ton pair",
    description:
      "Pair of adjustable 3-ton axle stands for safe under-vehicle work.",
    sku: "ONA-VULC-STAND-3T-PAIR",
    mpn: "AXLE-STAND-3T",
    priceMinor: 1650000,
    qty: 12,
    status: "active",
    attributes: { capacity: 3000, material: "Steel" },
    keywords: ["stand", "axle stand", "jack"],
    verificationStatus: "source_verified",
  },
];
