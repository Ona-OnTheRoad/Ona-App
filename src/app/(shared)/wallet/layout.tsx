import { NOINDEX } from "@/lib/seo/metadata";

export const metadata = NOINDEX;

/** Passthrough layout: only sets search-engine metadata for this area. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
