/**
 * Vulcanizer Shop taxonomy 34 category branches with subcategories.
 * Seeds shop_trade_categories for trade_key = vulcanizer.
 * Expandable; grounded in real tyre/tube/valve/equipment product classes sold
 * by tyre tradesmen (ETRTO-standard sizes, brand product lines).
 */

export type VulcCat = {
  slug: string;
  name: string;
  children?: VulcCat[];
};

import { VULCANIZER_TYRE_CATEGORIES } from "./vulcanizer-taxonomy/tree-tyres";
import { VULCANIZER_EQUIPMENT_CATEGORIES } from "./vulcanizer-taxonomy/tree-equipment";

export const VULCANIZER_CATEGORY_TREE: VulcCat[] = [
  ...VULCANIZER_TYRE_CATEGORIES,
  ...VULCANIZER_EQUIPMENT_CATEGORIES,
];

/** Flat walk for seeding: depth 0 roots then depth 1 children. */
export function walkVulcanizerCategories(): Array<{
  slug: string;
  name: string;
  parentSlug: string | null;
  depth: number;
  sortOrder: number;
}> {
  const out: Array<{
    slug: string;
    name: string;
    parentSlug: string | null;
    depth: number;
    sortOrder: number;
  }> = [];
  VULCANIZER_CATEGORY_TREE.forEach((root, i) => {
    out.push({
      slug: root.slug,
      name: root.name,
      parentSlug: null,
      depth: 0,
      sortOrder: i + 1,
    });
    (root.children || []).forEach((c, j) => {
      out.push({
        slug: c.slug,
        name: c.name,
        parentSlug: root.slug,
        depth: 1,
        sortOrder: j + 1,
      });
    });
  });
  return out;
}
