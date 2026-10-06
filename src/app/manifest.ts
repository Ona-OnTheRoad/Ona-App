import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

/**
 * Web app manifest: makes the phone-shell experience installable (Add to Home Screen / PWA).
 * Colours follow docs/UI.md: light chrome #c8c9cd for the title bar, brand copper for the
 * launch splash (the same copper as the in-app welcome screen).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ona",
    short_name: "Ona",
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    lang: "en-NG",
    dir: "ltr",
    display: "standalone",
    orientation: "portrait",
    background_color: "#af6533",
    theme_color: "#c8c9cd",
    categories: ["automotive", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
