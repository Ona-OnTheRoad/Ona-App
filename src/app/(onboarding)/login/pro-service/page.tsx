"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route → full Repair Pro signup */
export default function ProServiceRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/signup/pro");
  }, [router]);
  return (
    <div
      className="ona2 h-full w-full bg-ona-bg"
      aria-hidden
    />
  );
}
