export type FacetFilters = {
  categorySlug?: string | null;
  availability?: "in_stock" | "all";
  minPriceMinor?: number | null;
  maxPriceMinor?: number | null;
  attributes: Record<string, string | number | boolean>;
};

export type FilterDef =
  | { kind: "category"; key: string; label: string }
  | { kind: "price"; key: string; label: string }
  | { kind: "availability"; key: string; label: string }
  | {
      kind: "attribute";
      key: string;
      label: string;
      type: string;
      unit?: string;
      options?: string[];
    };

export type FacetCategory = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
};
