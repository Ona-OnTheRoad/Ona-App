"use client";

import { Suspense } from "react";
import { MotoristSignup } from "@/components/auth/motorist-signup";

export default function MotoristSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center ona2 bg-ona-bg text-sm font-semibold text-ona-ink">
          Loading Customer signup…
        </div>
      }
    >
      <MotoristSignup />
    </Suspense>
  );
}
