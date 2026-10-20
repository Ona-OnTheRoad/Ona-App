"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SavedLocationsSection } from "@/components/profile/motorist-own-profile/saved-locations-section";
import { useMotoristOwnProfile } from "@/components/profile/motorist-own-profile/use-motorist-own-profile";
import { profileFieldClass } from "@/components/profile/shared/field-class";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

function AddressesInner() {
  const router = useRouter();
  const { theme, authReady, isAuthenticated } = useApp();
  const isLight = theme === "light";
  const p = useMotoristOwnProfile();
  const field = profileFieldClass(isLight);

  if (!authReady) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center text-sm font-semibold",
          isLight ? "bg-[#F8F9FA] text-slate-800" : "bg-black text-white",
        )}
      >
        Loading addresses…
      </div>
    );
  }

  if (!isAuthenticated || !p.userProfile) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-3 px-4",
          isLight ? "bg-[#F8F9FA]" : "bg-black",
        )}
      >
        <p
          className={cn(
            "text-sm font-semibold",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          Sign in to view your addresses
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

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide",
        isLight ? "bg-[#F8F9FA]" : "bg-black",
      )}
    >
      <div className="w-full max-w-lg mx-auto px-4 pb-24 sm:pb-28">
        {/* Top Back bar */}
        <div className="flex items-center pt-2 mb-3">
          <button
            type="button"
            onClick={() => navigateBack(router, "/profile", "motorist")}
            className={cn(
              "-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              isLight
                ? "text-slate-900 hover:bg-black/5 active:bg-black/10"
                : "text-white hover:bg-white/10 active:bg-white/15",
            )}
            aria-label="Back to Profile"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Title */}
        <h1
          className={cn(
            "text-[24px] font-bold tracking-tight mb-1",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          Addresses &amp; Location
        </h1>
        <p
          className={cn(
            "text-[13px] mb-5",
            isLight ? "text-slate-500" : "text-white/60",
          )}
        >
          Home, Work, service area &amp; pin
        </p>

        {/* Saved locations section */}
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-sm",
            isLight ? "bg-white border-black/5" : "bg-[#1c1c1e] border-white/10",
          )}
        >
          <SavedLocationsSection
            isLight={isLight}
            editing={true}
            field={field}
            saved={p.saved}
            setSaved={p.setSaved}
            onAdd={p.addLocation}
          />
        </div>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#F8F9FA] text-sm font-semibold text-slate-800">
          Loading addresses…
        </div>
      }
    >
      <AddressesInner />
    </Suspense>
  );
}
