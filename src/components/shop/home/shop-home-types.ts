export type ShopHomeProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  tradeKey: string;
  primaryImageUrl: string | null;
  fromPriceMinor: number | null;
  currency: string;
  inStock: boolean;
  defaultVariantId?: string | null;
  vehicleTags?: string[];
  priceOnRequest?: boolean;
  stockLabel?: string;
  stockQty?: number;
};
