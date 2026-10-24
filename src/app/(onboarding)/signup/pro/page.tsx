"use client";

import { Suspense } from "react";
import { ProSignup } from "@/components/auth/pro-signup";

export default function ProSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white dark:bg-[#121316] text-sm font-semibold text-slate-700 dark:text-slate-300">
          Loading Repair Pro signup…
        </div>
      }
    >
      <ProSignup />
    </Suspense>
  );
}
