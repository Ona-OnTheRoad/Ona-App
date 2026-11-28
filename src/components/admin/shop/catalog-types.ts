export type ShopTab = "catalog" | "orders";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  trade_key: string;
  category_id: string;
  status: string;
  condition_type: string | null;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
  stock_qty?: number;
  availability?: string;
  listing_override?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
};

export type CategoryRow = {
  id: string;
  trade_key: string;
  slug: string;
  name: string;
  depth: number;
};

export type CreateProductForm = {
  name: string;
  subtitle: string;
  description: string;
  tradeKey: string;
  categoryId: string;
  sku: string;
  oemNumber: string;
  priceMajor: string;
  stockQty: string;
  status: "draft" | "active" | "archived";
  conditionType: string;
};

export type ProductEditDetail = {
  product: CatalogProduct & Record<string, unknown>;
  variants: Array<Record<string, unknown>>;
  prices: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  images: Array<Record<string, unknown>>;
};

export const EMPTY_CREATE_FORM: CreateProductForm = {
  name: "",
  subtitle: "",
  description: "",
  tradeKey: "mechanic",
  categoryId: "",
  sku: "",
  oemNumber: "",
  priceMajor: "",
  stockQty: "10",
  status: "active",
  conditionType: "original",
};

export const ADMIN_FIELD_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs text-gray-900 dark:text-white focus:border-ona-brand transition-colors";

/** Required fields for POST /api/admin/shop/products. */
export function canSubmitCreateProduct(form: CreateProductForm): boolean {
  if (!form.name.trim()) return false;
  if (!form.tradeKey.trim()) return false;
  if (!form.categoryId.trim()) return false;
  if (!form.sku.trim()) return false;
  if (form.priceMajor === "" || Number(form.priceMajor) < 0) return false;
  if (!Number.isFinite(Number(form.priceMajor))) return false;
  return true;
}

export function availabilityLabel(qty: number): {
  label: string;
  className: string;
} {
  if (qty <= 0) {
    return {
      label: "Out of Stock",
      className: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/50",
    };
  }
  if (qty <= 4) {
    return {
      label: "Low Stock",
      className:
        "text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-950/40",
    };
  }
  return {
    label: "In Stock",
    className:
      "text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/40",
  };
}
