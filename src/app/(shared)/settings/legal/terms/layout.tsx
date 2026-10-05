import { publicPageMetadata } from "@/lib/seo/metadata";

export const metadata = publicPageMetadata({
  title: "Terms of Service",
  description:
    "The rules for using Ona: booking and providing repair services in Nigeria, escrow, verification and account safety.",
  path: "/settings/legal/terms",
});

/** Public page: overrides the private (noindex) settings area so this one can be found. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
