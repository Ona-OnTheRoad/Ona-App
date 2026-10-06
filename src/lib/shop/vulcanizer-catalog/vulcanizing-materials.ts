import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const VULCANIZING_MATERIALS_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ VULCANIZING MATERIALS ------------------------------
  {
    id: "vulc-mat-cement-500ml",
    tradeKey: "vulcanizer",
    categorySlug: "vulcanizing-materials",
    subcategorySlug: "vulcanizing-cement",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Vulcanizing Cement 500ml",
    subtitle: "Rubber-to-rubber bonding cement · 500ml",
    description:
      "Cold vulcanizing cement for bonding patches to tyres and tubes. 500ml tin.",
    sku: "ONA-VULC-MAT-CEM-500",
    mpn: "VULC-CEM-500",
    priceMinor: 350000,
    qty: 140,
    status: "active",
    attributes: { material: "Rubber cement" },
    keywords: ["vulcanizing", "cement", "rubber cement", "glue"],
    verificationStatus: "source_verified",
  },
  {
    id: "vulc-mat-gum-cushion-roll",
    tradeKey: "vulcanizer",
    categorySlug: "vulcanizing-materials",
    subcategorySlug: "cushion-gum",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Cushion Gum Roll (uncured)",
    subtitle: "Uncured cushion gum · 1m roll",
    description:
      "Uncured cushion gum for section repairs and retreading build-up.",
    sku: "ONA-VULC-MAT-GUM-ROLL-001",
    mpn: "CUSHION-GUM-1M",
    priceMinor: 550000,
    qty: 40,
    status: "active",
    attributes: { material: "Uncured rubber" },
    keywords: ["cushion gum", "repair gum", "uncured rubber"],
    verificationStatus: "source_verified",
  },
];
