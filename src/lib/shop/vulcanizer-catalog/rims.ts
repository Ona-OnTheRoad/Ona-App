import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const RIMS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ RIMS ------------------------------
  {
    id: "vulc-rim-14-steel-4x100",
    tradeKey: "vulcanizer",
    categorySlug: "rims",
    subcategorySlug: "steel-rims",
    brand: { slug: "enkei", name: "Enkei" },
    name: "Enkei 14-inch Steel Rim 4x100",
    subtitle: 'Steel rim · 14" · 4x100 PCD',
    description:
      "14-inch steel rim, 4x100 bolt pattern, ET38 offset. Suitable for compact passenger cars.",
    sku: "ONA-VULC-RIM-ST-14-4X100-001",
    mpn: "RIM-ST-14-4X100",
    priceMinor: 1850000,
    qty: 22,
    status: "pending_verification",
    attributes: { rimSize: 14, material: "Steel" },
    keywords: ["rim", "steel", "14", "4x100"],
    verificationStatus: "pending",
  },
  {
    id: "vulc-rim-16-alloy-5x114.3",
    tradeKey: "vulcanizer",
    categorySlug: "rims",
    subcategorySlug: "alloy-rims",
    brand: { slug: "enkei", name: "Enkei" },
    name: "Enkei 16-inch Alloy Rim 5x114.3",
    subtitle: 'Alloy rim · 16" · 5x114.3 PCD',
    description:
      "16-inch alloy rim, 5x114.3 bolt pattern. Fits many Japanese SUVs and sedans.",
    sku: "ONA-VULC-RIM-AL-16-5X114-001",
    mpn: "RIM-AL-16-5X114",
    priceMinor: 3850000,
    qty: 10,
    status: "pending_verification",
    attributes: { rimSize: 16, material: "Aluminium" },
    keywords: ["rim", "alloy", "16", "5x114.3"],
    verificationStatus: "pending",
  },
];
