import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const ALIGNMENT_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ ALIGNMENT ------------------------------
  {
    id: "vulc-align-camber-bolt-kit",
    tradeKey: "vulcanizer",
    categorySlug: "alignment",
    subcategorySlug: "camber-kits",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Camber Adjustment Bolt Kit",
    subtitle: "Camber bolts · M12 x 1.25 · pair",
    description:
      "Pair of M12 x 1.25 camber adjustment bolts for strut-style front suspensions.",
    sku: "ONA-VULC-ALIGN-CMB-M12",
    mpn: "ALIGN-CAMBER-M12",
    priceMinor: 220000,
    qty: 45,
    status: "active",
    attributes: { material: "Steel" },
    keywords: ["alignment", "camber", "bolt"],
    verificationStatus: "pending",
  },
];
