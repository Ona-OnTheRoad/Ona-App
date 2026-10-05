import type { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { NewAccountBadge } from "@/components/profile/new-account-badge";
import type { PublicProfileTheme } from "@/components/technician/pro-public-profile/theme";
import { navigateBack } from "@/lib/navigation";
import type { Technician } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PublicProfileHeaderBar({
  tech,
  isLight,
  theme,
  skillLabel,
  backHref,
  isOwnProfile,
  router,
}: {
  tech: Technician;
  isLight: boolean;
  theme: PublicProfileTheme;
  skillLabel: string;
  backHref: string;
  isOwnProfile: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const { page, pageBg, solidBtn, ink, muted, insetBg } = theme;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 px-2.5 pb-1 pt-2.5",
        page,
      )}
      style={{ backgroundColor: pageBg }}
    >
      <button
        type="button"
        onClick={() =>
          navigateBack(router, backHref || "/", null /* parent only */)
        }
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border-0 text-base leading-none",
          solidBtn,
          ink,
        )}
        style={isLight ? undefined : { backgroundColor: insetBg }}
        aria-label="Back"
      >
        ←
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "flex flex-wrap items-center gap-1.5 text-[14px] font-bold leading-none",
            ink,
          )}
        >
          <span className="truncate">{tech.name}</span>
          <NewAccountBadge
            visibilityTier={tech.visibilityTier ?? (tech.isNewArtisan ? 1 : 4)}
            size="sm"
          />
        </p>
        <p className={cn("mt-0.5 truncate text-[11px] font-medium", muted)}>
          {skillLabel}
        </p>
      </div>
      {isOwnProfile ? (
        <button
          type="button"
          onClick={() => router.push("/profile?edit=1")}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-lg border-0 px-2.5 text-[11px] font-bold",
            solidBtn,
          )}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      ) : null}
    </div>
  );
}
