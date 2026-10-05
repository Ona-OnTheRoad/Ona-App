import type { DemoProduct } from "@/lib/shop/demo-catalog/types";

export type Seed = {
  slug: string;
  name: string;
  sub: string;
  desc: string;
  brand: string;
  /** Naira major units */
  price: number;
  qty: number;
  cat: string;
  attrs: Record<string, string | number | boolean>;
  kw: string[];
};

export function build(trade: string, seeds: Seed[]): DemoProduct[] {
  return seeds.map((s, i) => ({
    id: `demo-seed-${trade}-${s.slug}`,
    tradeKey: trade,
    categorySlug: s.cat,
    brand: {
      slug: s.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: s.brand,
    },
    name: s.name,
    subtitle: s.sub,
    description: s.desc,
    sku: `ONA-SEED-${trade.toUpperCase().slice(0, 4)}-${String(i + 1).padStart(3, "0")}`,
    priceMinor: s.price * 100,
    qty: s.qty,
    status: "active" as const,
    attributes: s.attrs,
    keywords: [...s.kw, s.brand.toLowerCase(), trade],
  }));
}
