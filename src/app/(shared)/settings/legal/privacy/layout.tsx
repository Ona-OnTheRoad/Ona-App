import { publicPageMetadata } from "@/lib/seo/metadata";

export const metadata = publicPageMetadata({
  title: "Privacy Policy",
  description:
    "How Ona handles your personal data: what we collect, why, and how to contact us about your information.",
  path: "/settings/legal/privacy",
});

/** Public page: overrides the private (noindex) settings area so this one can be found. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
