import { Copy, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { WALLET_ACCENT as accent, type ReferralData } from "./wallet-types";

export function WalletReferralCard({
  referral,
  copied,
  onCopy,
  isLight,
  card,
  ink,
  muted,
}: {
  referral: ReferralData | null;
  copied: boolean;
  onCopy: () => void;
  isLight: boolean;
  card: string;
  ink: string;
  muted: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3", card)}>
      <div className="flex items-center gap-1.5">
        <Gift className="h-4 w-4" style={{ color: accent }} />
        <p className={cn("text-[13px] font-bold", ink)}>Refer & Earn</p>
      </div>
      <p className={cn("mt-1 text-[11px] font-medium", muted)}>
        Share your code. Earn credits when friends sign up.
      </p>
      {referral?.code ? (
        <div className="mt-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2",
              isLight ? "bg-slate-100" : "bg-black/40",
            )}
          >
            <code
              className={cn("flex-1 text-[14px] font-bold tracking-wider", ink)}
            >
              {referral.code.referralCode}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-0"
              style={{ backgroundColor: accent, color: "#fff" }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {copied && (
            <p className="mt-0.5 text-[10px] font-medium text-green-500">
              Copied!
            </p>
          )}
        </div>
      ) : (
        <p className={cn("mt-1 text-[11px]", muted)}>
          Loading referral code...
        </p>
      )}
    </div>
  );
}
