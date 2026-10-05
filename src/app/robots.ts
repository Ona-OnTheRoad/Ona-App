import type { MetadataRoute } from "next";
import {
  PRIVATE_PATH_PREFIXES,
  PUBLIC_EXCEPTIONS,
  absoluteUrl,
  siteUrl,
} from "@/lib/site";

/**
 * Crawlers may read the public pages only. Private app screens, admin and APIs are
 * disallowed; public exceptions (the legal pages) are re-allowed because the longer
 * matching path wins.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", ...PUBLIC_EXCEPTIONS],
        disallow: [...PRIVATE_PATH_PREFIXES],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
