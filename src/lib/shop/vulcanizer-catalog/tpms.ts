import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const TPMS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ TPMS ------------------------------
  {
    id: "vulc-tpms-sensor-universal",
    tradeKey: "vulcanizer",
    categorySlug: "tpms",
    subcategorySlug: "tpms-sensors",
    brand: { slug: "schrader", name: "Schrader" },
    name: "Schrader TPMS Sensor (programmable)",
    subtitle: "Programmable TPMS sensor · 433 MHz",
    description:
      "433 MHz programmable TPMS sensor, cloned or programmed to vehicle. Sold with service kit.",
    sku: "ONA-VULC-TPMS-PROG-433-001",
    mpn: "TPMS-PROG-433",
    priceMinor: 4200000,
    qty: 15,
    status: "active",
    attributes: { material: "Plastic", tubeType: "Tubeless" },
    keywords: ["tpms", "sensor", "tyre pressure"],
    verificationStatus: "pending",
  },
];
