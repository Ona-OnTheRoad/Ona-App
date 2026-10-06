import { detectCurrency, formatMoney, fromMinorUnits } from "@/lib/pricing";

/** Format a minor-unit NGN amount for display; null renders as empty. */
export function formatShopPrice(minor: number | null): string {
  if (minor == null) return "";
  return formatMoney(fromMinorUnits(minor, "NGN"), detectCurrency());
}
