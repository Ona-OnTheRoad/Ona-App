import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import {
  isBvnComplete,
  isGovIdComplete,
  isLivenessComplete,
  isSkillComplete,
  type ProEmbedTierStep,
} from "@/lib/artisan/verification-order";
import { cn } from "@/lib/utils";

const EMBED_TITLES: Record<ProEmbedTierStep, string> = {
  phone: "Tier 1: Phone verification",
  gov_id: "Tier 2: Government ID",
  liveness: "Tier 3: Face liveness",
  bvn: "Tier 3: BVN",
  skill: "Tier 4: Proof of skill",
  done: "Verification complete",
};

const EMBED_HINTS: Record<ProEmbedTierStep, string> = {
  phone: "Verify your phone to unlock Tier 2.",
  gov_id: "Submit your ID for Care review. Next steps unlock after approval.",
  liveness: "Complete face liveness to continue.",
  bvn: "Submit BVN after liveness for full Tier 3 reach.",
  skill: "Upload proof of skill for Tier 4 review.",
  done: "All tiers are complete.",
};

/** Sheet embed: heading of the single active tier */
export function EmbedTierHeader({
  embedStep,
  tipBox,
}: {
  embedStep: ProEmbedTierStep | null;
  tipBox: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2 text-[11px] font-medium leading-snug",
        tipBox,
      )}
    >
      <p className="font-bold">{EMBED_TITLES[embedStep ?? "done"]}</p>
      <p className="mt-0.5">{EMBED_HINTS[embedStep ?? "done"]}</p>
    </div>
  );
}

/** Full page: verification order tip + status strip */
export function TierOrderIntro({
  profile,
  tipBox,
  isLight,
}: {
  profile: ArtisanVerificationProfile;
  tipBox: string;
  isLight: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "rounded-md px-3 py-2.5 text-[11px] font-medium leading-snug",
          tipBox,
        )}
      >
        <p className="font-bold">Verification order</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4">
          <li>Government ID (Tier 2): submit anytime for review</li>
          <li>Face liveness (Tier 3) after ID</li>
          <li>BVN (Tier 3) after ID: with liveness before skill</li>
          <li>Proof of skill (Tier 4): upload then submit for review</li>
        </ol>
        <p className="mt-2 font-medium">
          Profile Submit does not require Tier 2-4
        </p>
      </div>

      {/* Status strip complete = submitted or approved / passed */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Phone", profile.tiers.tier1_phone],
            ["Gov ID", isGovIdComplete(profile)],
            ["BVN", isBvnComplete(profile)],
            ["Liveness", isLivenessComplete(profile)],
            ["Skill", isSkillComplete(profile)],
          ] as const
        ).map(([label, ok]) => (
          <span
            key={label}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-bold",
              ok
                ? isLight
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-900/50 text-emerald-300"
                : isLight
                  ? "bg-black/10 text-slate-600"
                  : "bg-white/[0.08] text-[#a1a1a6]",
            )}
          >
            {ok ? "✓" : "·"} {label}
          </span>
        ))}
      </div>
    </>
  );
}
