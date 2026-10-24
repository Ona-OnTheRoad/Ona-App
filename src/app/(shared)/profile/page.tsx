"use client";

import { Suspense } from "react";
import { MotoristProfileHub } from "@/components/profile/motorist-profile/motorist-profile-hub";
import { useApp } from "@/lib/store";

function ProfileInner() {
  const { theme, authReady, isAuthenticated } = useApp();
  const isLight = theme === "light";

  if (!authReady) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-[#121316] text-sm font-semibold text-slate-800 dark:text-slate-200">
        Loading profile…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white dark:bg-[#121316] px-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Sign in to view your profile
        </p>
        <a
          href="/login/signin"
          className="rounded-xl bg-[#323231] px-4 py-2.5 text-[12px] font-bold text-white"
        >
          Sign in
        </a>
      </div>
    );
  }

  return <MotoristProfileHub isLight={isLight} />;
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-white dark:bg-[#121316] text-sm font-semibold text-slate-800 dark:text-slate-200">
          Loading profile…
        </div>
      }
    >
      <ProfileInner />
    </Suspense>
  );
}
