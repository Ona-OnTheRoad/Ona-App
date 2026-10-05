import { Shield } from "lucide-react";
import {
  canGoLive,
  resolveVisibilityTier,
  tier2GoLiveWarning,
} from "@/lib/artisan/status";
import { nextProEmbedTierStep } from "@/lib/artisan/verification-order";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import type { useT } from "@/lib/i18n";
import type { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Verification above Go Live card must contrast with shell (#c8c9cd / black) */
export function VerificationCard({
  artisan,
  t2CareOk,
  userProfile,
  isLight,
  ink,
  muted,
  t,
  setProOnboardingSheetRequired,
}: {
  artisan: ArtisanVerificationProfile | null;
  t2CareOk: boolean;
  userProfile: ReturnType<typeof useApp>["userProfile"];
  isLight: boolean;
  ink: string;
  muted: string;
  t: ReturnType<typeof useT>;
  setProOnboardingSheetRequired: ReturnType<
    typeof useApp
  >["setProOnboardingSheetRequired"];
}) {
  return (
    <section
      className={cn(
        "rounded-md px-3 py-3",
        isLight
          ? "bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-black/10"
          : "bg-[#1c1c1e] ring-1 ring-white/15",
      )}
    >
      {(() => {
        const tier = artisan
          ? resolveVisibilityTier(artisan)
          : t2CareOk
            ? 2
            : 1;
        const hasApproved =
          tier >= 2 ||
          t2CareOk ||
          Boolean(artisan?.tiers?.tier2_govId) ||
          artisan?.govIdReviewStatus === "approved";
        const nextStep = artisan
          ? nextProEmbedTierStep(artisan, {
              hidePhone: Boolean(
                artisan.tiers?.tier1_phone || userProfile?.phoneVerified,
              ),
              hideGovId: t2CareOk,
            })
          : t2CareOk
            ? "liveness"
            : "phone";
        const needsContinue = nextStep !== "done";
        const g = artisan
          ? canGoLive(artisan)
          : { allowed: false, message: "" };
        const warn =
          artisan?.status === "approved" ? tier2GoLiveWarning(artisan) : null;
        const statusLine =
          !needsContinue && artisan && artisan.status !== "approved"
            ? artisan.status === "draft"
              ? t("gate.finishBeforeLive")
              : g.allowed
                ? ""
                : g.message
            : "";
        const openSetup = () => {
          setProOnboardingSheetRequired(true);
          void import("@/components/pro/pro-onboarding-sheet").then((m) =>
            m.requestProOnboardingSheetExpand(),
          );
        };
        return (
          <div className="flex items-start gap-2">
            <Shield
              className="mt-0.5 h-5 w-5 shrink-0"
              strokeWidth={2.25}
              style={
                hasApproved
                  ? {
                      // Solid green fill readable on light and dark cards
                      color: isLight ? "#047857" : "#6ee7b7",
                      fill: isLight ? "#059669" : "#10b981",
                    }
                  : {
                      color: "#FF6B35",
                      fill: "none",
                    }
              }
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[13px] font-bold", ink)}>Tier {tier}</p>
              {statusLine ? (
                <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
                  {statusLine}
                </p>
              ) : null}
              {warn && !needsContinue ? (
                <p className="mt-1.5 text-[11px] font-semibold text-[#FF6B35]">
                  {warn}
                </p>
              ) : null}
              {needsContinue ? (
                <button
                  type="button"
                  className="mt-1.5 inline-flex border-0 bg-transparent p-0 text-[11px] font-semibold text-[#FF6B35]"
                  onClick={openSetup}
                >
                  Continue Verification
                </button>
              ) : null}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
