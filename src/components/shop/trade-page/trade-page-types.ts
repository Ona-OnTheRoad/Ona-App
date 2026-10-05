export type TradeProductCard = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  fromPriceMinor: number | null;
  inStock: boolean;
  status?: string | null;
  availabilityLabel?: string | null;
  fitmentStatus?: string | null;
  fitmentBadge?: string | null;
  fitmentScore?: number;
  matchReasons?: string[];
  defaultVariantId?: string | null;
  vehicleTags?: string[];
  priceOnRequest?: boolean;
  stockLabel?: string;
  stockQty?: number;
};

export type AllPartsCat = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  depth: number;
};

/** Neutral browse level a category or subcategory shown as a listing row. */
export type BrowseCat = {
  id: string;
  slug: string;
  name: string;
  productCount?: number;
  depth: number;
};

/** Theme-derived class names shared by the trade page sections. */
export type TradeTone = {
  isLight: boolean;
  accentText: string;
  accentBg: string;
  card: string;
  muted: string;
};
