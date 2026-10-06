import { ChevronRight } from "lucide-react";
import type { RefObject } from "react";
import type {
  ArtisanVerificationProfile,
  GovIdType,
} from "@/lib/artisan/types";
import { cn } from "@/lib/utils";
import type { PatchProfile } from "./types";

const ID_TYPE_OPTIONS = [
  { value: "nin" as GovIdType, label: "National ID (NIN card)" },
  { value: "drivers_licence" as GovIdType, label: "Driver’s Licence" },
  { value: "voters_card" as GovIdType, label: "Voter’s Card" },
  {
    value: "international_passport" as GovIdType,
    label: "International Passport",
  },
] as const;

function idTypeLabel(type: GovIdType | null | undefined): string {
  return type === "nin"
    ? "National ID (NIN card)"
    : type === "drivers_licence"
      ? "Driver’s Licence"
      : type === "voters_card"
        ? "Voter’s Card"
        : type === "international_passport"
          ? "International Passport"
          : "ID type…";
}

/** Closed field keeps hairline; open options list has no border */
export function IdTypeSelect({
  profile,
  patch,
  wrapRef,
  open,
  setOpen,
  selectClass,
  isLight,
}: {
  profile: ArtisanVerificationProfile;
  patch: PatchProfile;
  wrapRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (next: boolean | ((o: boolean) => boolean)) => void;
  selectClass: string;
  isLight: boolean;
}) {
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={
          profile.tiers.tier2_govId || profile.govIdReviewStatus === "submitted"
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (
            profile.tiers.tier2_govId ||
            profile.govIdReviewStatus === "submitted"
          ) {
            return;
          }
          setOpen((o) => !o);
        }}
        className={cn(
          selectClass,
          "flex items-center justify-between gap-2 text-left disabled:opacity-60",
        )}
      >
        <span
          className={cn(
            !profile.govIdType &&
              (isLight ? "text-slate-400" : "text-white/35"),
          )}
        >
          {idTypeLabel(profile.govIdType)}
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-90",
            isLight ? "text-slate-500" : "text-white/45",
          )}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto overscroll-contain rounded-lg border-0 py-1 shadow-lg",
            isLight ? "bg-white" : "bg-[#1c1c1e]",
          )}
        >
          {ID_TYPE_OPTIONS.map((opt) => {
            const selected = profile.govIdType === opt.value;
            return (
              <li key={opt.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full border-0 bg-transparent px-3 py-2.5 text-left text-[14px] font-medium",
                    selected
                      ? "bg-[#FF6B35]/15 text-[#FF6B35]"
                      : isLight
                        ? "text-slate-900 hover:bg-black/[0.05]"
                        : "text-white hover:bg-white/[0.08]",
                  )}
                  onClick={() => {
                    patch({
                      govIdType: opt.value,
                      govIdFront: null,
                      govIdBack: null,
                      tiers: {
                        ...profile.tiers,
                        tier2_govId: false,
                      },
                      govIdReviewStatus: "none",
                    });
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
