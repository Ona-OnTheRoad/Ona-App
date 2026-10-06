import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ARTISAN_STEP_KEY, supportsLga } from "@/lib/geo/service-area";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import { cn } from "@/lib/utils";
import { ReqStar } from "./req-star";
import type { OnboardingStyles } from "./types";

/** One row linking to a state/city/LGA picker route (remembers the step) */
function ServiceAreaLink({
  href,
  title,
  required,
  subtitle,
  styles,
}: {
  href: string;
  title: ReactNode;
  required?: boolean;
  subtitle: string;
  styles: Pick<OnboardingStyles, "ink" | "muted">;
}) {
  const { ink, muted } = styles;
  return (
    <Link
      href={href}
      onClick={() => {
        try {
          sessionStorage.setItem(ARTISAN_STEP_KEY, "essentials");
        } catch {
          /* */
        }
      }}
      className="flex w-full items-center gap-2 border-0 px-3 py-3 no-underline"
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[13px] font-bold", ink)}>
          {title}
          {required ? <ReqStar /> : null}
        </span>
        <span className={cn("block text-[11px] font-medium", muted)}>
          {subtitle}
        </span>
      </span>
      <ChevronRight className={cn("h-4 w-4 shrink-0", muted)} />
    </Link>
  );
}

/** State / Cities / LGA navigation rows */
export function ServiceAreaLinks({
  profile,
  styles,
}: {
  profile: ArtisanVerificationProfile;
  styles: OnboardingStyles;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md",
        styles.isLight ? "bg-black/[0.05]" : "bg-white/[0.06]",
      )}
    >
      <ServiceAreaLink
        href="/artisan/onboarding/states"
        title="Service area states"
        required
        subtitle={profile.serviceArea.states[0] || "Pick one state"}
        styles={styles}
      />
      <ServiceAreaLink
        href="/artisan/onboarding/cities"
        title="Cities"
        required
        subtitle={
          profile.serviceArea.cities.length
            ? profile.serviceArea.cities.join(", ")
            : profile.serviceArea.states[0]
              ? "Pick cities you serve"
              : "Choose a state first"
        }
        styles={styles}
      />
      {supportsLga(profile.serviceArea.countryCode || "NG") ? (
        <ServiceAreaLink
          href="/artisan/onboarding/lgas"
          title="LGA"
          subtitle={
            profile.serviceArea.lgas.length
              ? profile.serviceArea.lgas.join(", ")
              : profile.serviceArea.states[0]
                ? "Pick LGAs (optional)"
                : "Choose a state first"
          }
          styles={styles}
        />
      ) : null}
    </div>
  );
}
