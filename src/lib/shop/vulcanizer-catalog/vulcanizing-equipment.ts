import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const VULCANIZING_EQUIPMENT_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ VULCANIZING EQUIPMENT ------------------------------
  {
    id: "vulc-eqp-spot-vulcanizer",
    tradeKey: "vulcanizer",
    categorySlug: "vulcanizing-equipment",
    subcategorySlug: "spot-vulcanizers",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Electric Spot Vulcanizer (1200W)",
    subtitle: "1200W spot vulcanizer · for tubes and carcass repairs",
    description:
      "Bench-top electric spot vulcanizer for tube and tyre carcass repair. 1200W, 220-240V.",
    sku: "ONA-VULC-EQP-SPOT-1200",
    mpn: "SPOT-VULC-1200",
    priceMinor: 1850000,
    qty: 0,
    status: "future_product",
    attributes: { voltage: 220, material: "Metal" },
    keywords: ["vulcanizer", "spot", "machine", "repair"],
    verificationStatus: "pending",
  },
  {
    id: "vulc-eqp-heat-pad-15x20",
    tradeKey: "vulcanizer",
    categorySlug: "vulcanizing-equipment",
    subcategorySlug: "heat-curing-pads",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Heat Curing Pad 15x20cm",
    subtitle: "Rubber heat curing pad · 15×20 cm",
    description:
      "Heat curing pad for patch and section curing at the vulcanizing bench.",
    sku: "ONA-VULC-EQP-PAD-1520",
    mpn: "HEATPAD-15X20",
    priceMinor: 750000,
    qty: 12,
    status: "active",
    attributes: { material: "Rubber" },
    keywords: ["heat pad", "curing", "vulcanizing"],
    verificationStatus: "pending",
  },
];
