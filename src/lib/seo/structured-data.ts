import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";

/** schema.org Organization: who runs the site (used site-wide). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
    image: absoluteUrl(OG_IMAGE.url),
    areaServed: { "@type": "Country", name: "Nigeria" },
  };
}

/** schema.org WebApplication: what the product is (site-wide, in the root layout so it is in every server response). */
export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    inLanguage: "en-NG",
    areaServed: { "@type": "Country", name: "Nigeria" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
  };
}
