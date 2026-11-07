"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerReviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/verification?tab=customer_id");
  }, [router]);
  return (
    <div className="p-8 text-sm text-gray-400">
      Redirecting to Customer ID Review…
    </div>
  );
}
