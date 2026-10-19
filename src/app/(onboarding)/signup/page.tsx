"use client";

import { Suspense } from "react";
import { SignupDetails } from "@/components/auth/signup-details";

/** Sign Up step 1: shared "Create account" details. */
export default function SignUpDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-sm text-white/50">
          Loading…
        </div>
      }
    >
      <SignupDetails />
    </Suspense>
  );
}
