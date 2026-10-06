export type Variant = {
  id: string;
  sku: string;
  mpn?: string | null;
  oem_number?: string | null;
  title?: string;
  option_label?: string | null;
  stock_available?: number;
};

export type Price = {
  variant_id: string;
  amount_minor: number;
  compare_at_minor?: number | null;
};

export type ProductImage = { url: string; alt_text?: string };
