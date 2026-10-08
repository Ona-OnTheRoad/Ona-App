export type ShopAccountContext = "motorist" | "professional";

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantTitle: string;
  sku: string;
  qty: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  inStock: boolean;
  availableQty: number;
};

export type CartView = {
  id: string;
  userId: string;
  accountContext: ShopAccountContext;
  currency: string;
  items: CartLine[];
  subtotalMinor: number;
  itemCount: number;
};
