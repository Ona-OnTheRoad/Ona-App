import type { ShopTradeKey } from "@/lib/shop/taxonomy";

export type TradeAttributeType = "number" | "text" | "enum" | "boolean";

export type TradeAttributeDef = {
  key: string;
  label: string;
  type: TradeAttributeType;
  unit?: string;
  /** Required when creating a product for this trade. */
  required?: boolean;
  /** Show as a filter facet in the shop UI. */
  filterable?: boolean;
  /** Enum options (when type === "enum"). */
  options?: string[];
  /** Optional explainer for admins/data sources. */
  hint?: string;
};

export type TradeAttributeSchema = {
  tradeKey: ShopTradeKey;
  /** Attributes valid for this trade. */
  attributes: TradeAttributeDef[];
  /** Subset of keys that make a fitment/vehicle claim. */
  vehicleFitmentKeys: string[];
  /** True when this trade must not carry any vehicle fitment data. */
  vehicleForbidden: boolean;
};
