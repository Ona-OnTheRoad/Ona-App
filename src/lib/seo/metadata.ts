import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, absoluteUrl } from "@/lib/site";

/** Login-gated app screens: keep out of search results and do not follow links. */
export const NOINDEX: Metadata = {
  robots: { index: false, follow: false },
};

/** Sign-in / sign-up forms: not worth indexing, but their links are fine to follow. */
export const NOINDEX_FOLLOW: Metadata = {
  robots: { index: false, follow: true },
};

/** Metadata for a page that is meant to be found: own title, snippet, canonical and social card. */
export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${input.title} | ${SITE_NAME}`,
      description: input.description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${SITE_NAME}`,
      description: input.description,
      images: [OG_IMAGE.url],
    },
  };
}
