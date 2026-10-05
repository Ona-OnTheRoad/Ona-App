import { tradeDef } from "@/lib/artisan/catalog";
import { professionAnswersValid } from "@/lib/artisan/profession-questions";
import {
  isBvnComplete,
  isGovIdComplete,
  isLivenessComplete,
  isSkillComplete,
} from "@/lib/artisan/verification-order";
import { cn } from "@/lib/utils";
import type { StepBaseProps } from "./types";

type Props = Omit<StepBaseProps, "patch"> & {
  busy: boolean;
  submitReview: () => Promise<void>;
};

/** Step 8: single clean summary card + submit */
export function ReviewStep({ profile, styles, busy, submitReview }: Props) {
  const { ink, muted, isLight } = styles;
  const trade = tradeDef(profile.trade.service);
  return (
    <section className="space-y-4">
      <div>
        <h2 className={cn("text-[17px] font-bold tracking-tight", ink)}>
          Review & submit
        </h2>
        <p className={cn("mt-1 text-[12px] font-medium", muted)}>
          Confirm your details, then send for admin approval
        </p>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-md",
          isLight ? "bg-black/[0.05]" : "bg-white/[0.06]",
        )}
      >
        {(
          [
            [
              "Trade",
              `${trade?.label || "Trade"}${
                profile.trade.specialty ? ` · ${profile.trade.specialty}` : ""
              }`,
            ],
            [
              "Skills",
              professionAnswersValid(
                profile.trade.service,
                profile.professionAnswers || {},
              )
                ? "Complete"
                : "Incomplete",
            ],
            ["Phone", profile.tiers.tier1_phone ? "Verified" : "Not verified"],
            ["Experience", `${profile.yearsExperience} yr`],
            [
              "Service area",
              [
                profile.serviceArea.countryName ||
                  profile.serviceArea.countryCode,
                ...profile.serviceArea.states,
                ...profile.serviceArea.cities,
              ]
                .filter(Boolean)
                .join(" · ") || "Not set",
            ],
            ["Tools", String(profile.toolsOwned.length)],
            [
              "Guarantor",
              [profile.guarantor.fullName, profile.guarantor.phone]
                .filter(Boolean)
                .join(" · ") || "Not set",
            ],
            ["Portfolio", `${profile.portfolio.length} photos`],
            ["Intro video", profile.introVideo ? "Yes" : "No"],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-3 px-3.5 py-2.5"
          >
            <span
              className={cn(
                "shrink-0 text-[11px] font-semibold uppercase tracking-wide",
                muted,
              )}
            >
              {label}
            </span>
            <span
              className={cn(
                "min-w-0 text-right text-[13px] font-semibold leading-snug",
                ink,
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Verification chips compact */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["ID", isGovIdComplete(profile)],
            ["BVN", isBvnComplete(profile)],
            ["Liveness", isLivenessComplete(profile)],
            ["Skill", isSkillComplete(profile)],
          ] as const
        ).map(([label, ok]) => (
          <span
            key={label}
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-bold",
              ok
                ? "bg-[#FF6B35]/15 text-[#FF6B35]"
                : isLight
                  ? "bg-black/8 text-slate-600"
                  : "bg-white/10 text-white/55",
            )}
          >
            {ok ? "✓" : "·"} {label}
          </span>
        ))}
      </div>

      <p
        className={cn(
          "text-center text-[11px] font-medium leading-snug",
          muted,
        )}
      >
        Status becomes Pending Review. An admin must approve before Go Live.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={submitReview}
        className="h-12 w-full rounded-md border-0 bg-[#FF6B35] text-[14px] font-bold text-white disabled:opacity-50"
      >
        Submit for review
      </button>
    </section>
  );
}
