import type { VulcanizerProduct } from "@/lib/shop/vulcanizer-catalog/types";

export const BALANCING_PRODUCTS: VulcanizerProduct[] = [
  // ------------------------------ BALANCING ------------------------------
  {
    id: "vulc-balancer-semi-auto",
    tradeKey: "vulcanizer",
    categorySlug: "balancing",
    subcategorySlug: "wheel-balancers-semi",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Semi-Automatic Wheel Balancer",
    subtitle: "Semi-automatic balancer · passenger & LT rims",
    description:
      "Semi-automatic wheel balancer with spin indicator for passenger and light truck wheels.",
    sku: "ONA-VULC-BAL-SEMI-001",
    mpn: "BAL-SEMI-1",
    priceMinor: 1650000,
    qty: 3,
    status: "future_product",
    attributes: { material: "Steel" },
    keywords: ["balancer", "balancing", "machine"],
    verificationStatus: "pending",
  },
  {
    id: "vulc-weight-adhesive-25g",
    tradeKey: "vulcanizer",
    categorySlug: "balance-weights",
    subcategorySlug: "adhesive-weights",
    brand: { slug: "ona-pro", name: "Ona Pro" },
    name: "Ona Pro Adhesive Wheel Weights 25g (box of 50)",
    subtitle: "Self-adhesive balance weights · 25g",
    description:
      "Box of 50 self-adhesive zinc wheel balance weights, 25 g each.",
    sku: "ONA-VULC-WGT-ADH-25G-050",
    mpn: "WGT-ADH-25",
    priceMinor: 300000,
    qty: 75,
    status: "active",
    attributes: { material: "Zinc" },
    keywords: ["balance weight", "wheel weight", "adhesive"],
    verificationStatus: "source_verified",
  },
];
