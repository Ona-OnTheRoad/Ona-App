"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminContentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/settings?tab=content");
  }, [router]);
  return (
    <div className="p-8 text-sm text-gray-400">
      Redirecting to Content & Menus…
    </div>
  );
}
