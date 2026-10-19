import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AppConfigProvider } from "@/components/app-config-provider";
import { AppFrame } from "@/components/layout/app-frame";
import { JsonLd } from "@/components/seo/json-ld";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { NoScriptNotice } from "@/components/seo/no-script-notice";
import { ONA_BUILD_ID } from "@/lib/build-id";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  siteUrl,
} from "@/lib/site";
import { I18nProvider } from "@/lib/i18n";
import {
  organizationJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo/structured-data";
import { AppProvider } from "@/lib/store";
import "./globals.css";

/**
 * Inter closest free match to X’s Chirp (clean grotesque sans).
 * Used app-wide for menus, body, and chrome.
 */
const interSans = Inter({
  variable: "--font-ona-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: SITE_LOCALE,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    // Help in-app browsers (WhatsApp, Instagram, etc.) render full height
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c8c9cd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      data-ona-build={ONA_BUILD_ID}
      className={`${interSans.variable} ${geistMono.variable} h-full max-h-full overflow-hidden antialiased`}
      style={{ height: "100%", maxHeight: "100%" }}
    >
      <head>
        {/*
          First paint follows the user's saved theme, else the OS theme (the
          store re-applies the same rule after hydration), so dark-mode users
          never see a light flash.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ona-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}`,
          }}
        />
      </head>
      {/* Inline stage color so first paint is never browser-default white */}
      <body
        className="h-full max-h-full overflow-hidden text-white"
        style={{
          overscrollBehavior: "none",
          backgroundColor: "#060d0a",
          margin: 0,
        }}
      >
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webApplicationJsonLd()} />
        <NoScriptNotice />
        <ServiceWorkerRegistrar />
        <AppConfigProvider>
          <AppProvider>
            <I18nProvider>
              <AppFrame>{children}</AppFrame>
            </I18nProvider>
          </AppProvider>
        </AppConfigProvider>
      </body>
    </html>
  );
}
