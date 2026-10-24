"use client";

import { Suspense } from "react";
import { PersonalInfoScreen } from "@/components/profile/personal-info/personal-info-screen";
import { useApp } from "@/lib/store";

function PersonalInfoInner() {
  const { authReady, isAuthenticated } = useApp();

  if (!authReady) {
    return (
      <div className="ona2 flex h-full items-center justify-center bg-ona-bg text-sm font-semibold text-ona-muted">
        Loading personal info…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="ona2 flex h-full flex-col items-center justify-center gap-3 bg-ona-bg px-4">
        <p className="text-sm font-semibold text-ona-ink">
          Sign in to view your profile
        </p>
        <a
          href="/login/signin"
          className="rounded-ona-ctl bg-ona-brand-btn px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
        >
          Sign in
        </a>
      </div>
    );
  }

  return <PersonalInfoScreen />;
}

export default function PersonalInfoPage() {
  return (
    <Suspense
      fallback={
        <div className="ona2 flex h-full items-center justify-center bg-ona-bg text-sm font-semibold text-ona-muted">
          Loading personal info…
        </div>
      }
    >
      <PersonalInfoInner />
    </Suspense>
  );
}
