import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const TYRE_CARE_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ TYRE CARE ------------------------------
  {
    id: "vulc-care-dressing-500ml",
    tradeKey: "vulcanizer",
    categorySlug: "tire-care-chemicals",
    subcategorySlug: "tyre-dressing",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Tyre Dressing 500ml",
    subtitle: "Water-based tyre dressing · 500ml",
    description:
      "Water-based tyre dressing that restores a clean satin-black finish without greasy residue.",
    sku: "ONA-VULC-CARE-DRESS-500",
    mpn: "TYRE-DRESS-500",
    priceMinor: 280000,
    qty: 130,
    status: "active",
    attributes: { material: "Liquid" },
    keywords: ["tyre dressing", "tire shine", "care"],
    verificationStatus: "source_verified",
  },
  {
    id: "vulc-care-bead-lube-1kg",
    tradeKey: "vulcanizer",
    categorySlug: "tire-care-chemicals",
    subcategorySlug: "bead-lubricant",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Bead Lubricant / Mounting Paste 1kg",
    subtitle: "Tyre mounting lubricant · 1kg tub",
    description:
      "Bead lubricant and mounting paste that prevents bead and rim damage during mounting.",
    sku: "ONA-VULC-CARE-BEADLUBE-1KG",
    mpn: "BEAD-LUBE-1KG",
    priceMinor: 220000,
    qty: 95,
    status: "active",
    attributes: { material: "Paste" },
    keywords: ["bead lubricant", "mounting paste", "tyre mounting"],
    verificationStatus: "source_verified",
  },
];
