"use client";

import { Suspense } from "react";
import { SignupVerify } from "@/components/auth/signup-verify";

/** Sign Up step 2: "Verify your number" (skippable for now). */
export default function SignUpVerifyPage() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <SignupVerify />
    </Suspense>
  );
}
