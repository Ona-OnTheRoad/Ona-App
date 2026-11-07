"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminHealthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/settings?tab=health");
  }, [router]);
  return (
    <div className="p-8 text-sm text-gray-400">
      Redirecting to System Health…
    </div>
  );
}
