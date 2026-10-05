import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const POWER_TOOLS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ POWER TOOLS ------------------------------
  {
    id: "vulc-impact-wrench-1in",
    tradeKey: "vulcanizer",
    categorySlug: "power-tools",
    subcategorySlug: "impact-wrenches",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro 1-inch Impact Wrench",
    subtitle: 'Air impact wrench · 1" drive · 1200 Nm',
    description: "1-inch air impact wrench, 1200 Nm, for truck wheel nuts.",
    sku: "ONA-VULC-PWR-IMP-1IN",
    mpn: "IMPACT-1IN",
    priceMinor: 1250000,
    qty: 8,
    status: "active",
    attributes: { material: "Metal" },
    keywords: ["impact wrench", "air tool", "nut remover"],
    verificationStatus: "pending",
  },
];
