import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const SAFETY_PPE_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ SAFETY / PPE ------------------------------
  {
    id: "vulc-ppe-gloves-nitrile",
    tradeKey: "vulcanizer",
    categorySlug: "safety-ppe",
    subcategorySlug: "safety-gloves",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Nitrile Work Gloves (box of 100)",
    subtitle: "Nitrile gloves · heavy-duty · 100 pcs",
    description:
      "Heavy-duty nitrile gloves for handling cement, patches and cleaning chemicals.",
    sku: "ONA-VULC-PPE-NIT-100",
    mpn: "PPE-NITRILE-100",
    priceMinor: 450000,
    qty: 60,
    status: "active",
    attributes: { material: "Nitrile" },
    keywords: ["gloves", "ppe", "nitrile"],
    verificationStatus: "source_verified",
  },
  {
    id: "vulc-ppe-goggles",
    tradeKey: "vulcanizer",
    categorySlug: "safety-ppe",
    subcategorySlug: "safety-glasses",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Safety Glasses",
    subtitle: "Impact-rated safety glasses",
    description:
      "Impact-rated clear safety glasses for grinding and buffing work.",
    sku: "ONA-VULC-PPE-GOG-001",
    mpn: "PPE-GOGGLE-1",
    priceMinor: 90000,
    qty: 85,
    status: "active",
    attributes: { material: "Plastic" },
    keywords: ["goggles", "safety glasses", "ppe"],
    verificationStatus: "source_verified",
  },
];
