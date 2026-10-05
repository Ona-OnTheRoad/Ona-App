import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS, absoluteUrl } from "@/lib/site";

/** Only pages that are public and meant to be indexed (see INDEXABLE_PATHS). */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : 0.3,
  }));
}
