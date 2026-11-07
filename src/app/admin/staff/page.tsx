"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminStaffRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/settings?tab=staff");
  }, [router]);
  return (
    <div className="p-8 text-sm text-gray-400">
      Redirecting to Staff Levels…
    </div>
  );
}
