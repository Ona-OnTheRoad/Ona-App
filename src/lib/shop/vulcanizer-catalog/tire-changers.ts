import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const TIRE_CHANGERS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ TIRE CHANGERS ------------------------------
  {
    id: "vulc-changer-manual-single",
    tradeKey: "vulcanizer",
    categorySlug: "tire-changers",
    subcategorySlug: "manual-tire-changers",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Manual Tyre Changer (single arm)",
    subtitle: 'Manual tyre changer · passenger rims 12-16"',
    description:
      "Manual single-arm tyre changer for passenger and light commercial rims.",
    sku: "ONA-VULC-CHG-MAN-001",
    mpn: "CHG-MAN-1",
    priceMinor: 1450000,
    qty: 5,
    status: "active",
    attributes: { material: "Steel" },
    keywords: ["tyre changer", "tire changer", "manual", "machine"],
    verificationStatus: "pending",
  },
];
