"use client";

import { Suspense } from "react";
import { PersonalInfoScreen } from "@/components/profile/personal-info/personal-info-screen";
import { useApp } from "@/lib/store";

function PersonalInfoInner() {
  const { theme, authReady, isAuthenticated } = useApp();
  const isLight = theme === "light";

  if (!authReady) {
    return (
      <div
        className={
          isLight
            ? "flex h-full items-center justify-center bg-[#F8F9FA] text-sm font-semibold text-slate-800"
            : "flex h-full items-center justify-center bg-black text-sm font-semibold text-white"
        }
      >
        Loading personal info…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className={
          isLight
            ? "flex h-full flex-col items-center justify-center gap-3 bg-[#F8F9FA] px-4"
            : "flex h-full flex-col items-center justify-center gap-3 bg-black px-4"
        }
      >
        <p
          className={
            isLight
              ? "text-sm font-semibold text-slate-900"
              : "text-sm font-semibold text-white"
          }
        >
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

  return <PersonalInfoScreen isLight={isLight} />;
}

export default function PersonalInfoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#F8F9FA] text-sm font-semibold text-slate-800">
          Loading personal info…
        </div>
      }
    >
      <PersonalInfoInner />
    </Suspense>
  );
}
