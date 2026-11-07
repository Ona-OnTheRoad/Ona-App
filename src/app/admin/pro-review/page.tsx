"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProReviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/verification?tab=pro_id");
  }, [router]);
  return (
    <div className="p-8 text-sm text-gray-400">
      Redirecting to Pro ID Review…
    </div>
  );
}
