import { NOINDEX_FOLLOW } from "@/lib/seo/metadata";

export const metadata = NOINDEX_FOLLOW;

/** Passthrough layout: only sets search-engine metadata for this area. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
