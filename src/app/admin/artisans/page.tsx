"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Merged into /admin/pros (Service Pros hub · Review tab) */
export default function ArtisansRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/pros?tab=review");
  }, [router]);
  return (
    <p style={{ padding: 24, fontFamily: "system-ui" }}>
      Redirecting to Service Pros · Review…
    </p>
  );
}
