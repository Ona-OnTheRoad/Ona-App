export type VulcanizerProduct = {
  /** Deterministic id seed key for idempotency. */
  id: string;
  tradeKey: "vulcanizer";
  categorySlug: string;
  subcategorySlug?: string;
  brand: { slug: string; name: string };
  name: string;
  subtitle: string;
  description: string;
  sku: string;
  mpn?: string;
  oemNumber?: string;
  priceMinor: number;
  /** Starting stock; 0 = exists but currently unavailable. */
  qty: number;
  status:
    | "active"
    | "inactive"
    | "unavailable"
    | "discontinued"
    | "pending_verification"
    | "source_pending"
    | "future_product";
  attributes: Record<string, string | number | boolean>;
  keywords: string[];
  verificationStatus?: "source_verified" | "pending";
};
