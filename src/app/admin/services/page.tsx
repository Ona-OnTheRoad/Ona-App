"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminServicesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/settings?tab=services");
  }, [router]);
  return (
    <div className="p-8 text-sm text-gray-400">
      Redirecting to Services Catalog…
    </div>
  );
}
