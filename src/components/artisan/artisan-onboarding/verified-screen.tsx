import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

/** Shown instead of the wizard once the profile is approved (full mode) */
export function VerifiedScreen({
  sheetBg,
  ink,
  muted,
  onDashboard,
}: {
  sheetBg: string;
  ink: string;
  muted: string;
  onDashboard: () => void;
}) {
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: sheetBg }}>
      <PageHeader title="Verified" backHref="/dashboard" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Check className="h-10 w-10 text-emerald-600" />
        <p className={cn("text-[16px] font-bold", ink)}>You are approved</p>
        <p className={cn("max-w-xs text-[13px]", muted)}>
          You can Go Live and complete optional verification tiers anytime from
          Profile.
        </p>
        <button
          type="button"
          onClick={onDashboard}
          className="h-11 rounded-md border-0 bg-[#323231] px-5 text-[13px] font-bold text-white"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
