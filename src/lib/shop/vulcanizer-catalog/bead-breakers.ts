import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const BEAD_BREAKERS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ BEAD BREAKERS ------------------------------
  {
    id: "vulc-bead-breaker-manual",
    tradeKey: "vulcanizer",
    categorySlug: "bead-breakers",
    subcategorySlug: "manual-bead-breakers",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Manual Bead Breaker",
    subtitle: "Foot-operated bead breaker",
    description:
      "Foot-operated manual bead breaker for passenger and light truck tyres.",
    sku: "ONA-VULC-BEAD-MAN-001",
    mpn: "BEAD-MAN-1",
    priceMinor: 950000,
    qty: 7,
    status: "active",
    attributes: { material: "Steel" },
    keywords: ["bead breaker", "bead", "manual"],
    verificationStatus: "pending",
  },
];
