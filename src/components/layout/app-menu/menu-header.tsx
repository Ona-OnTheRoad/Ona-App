import { NewAccountBadge } from "@/components/profile/new-account-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getArtisanProfile } from "@/lib/artisan/local-store";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MenuHeader({
  isLight,
  fullNameDisplay,
  timeGreeting,
}: {
  isLight: boolean;
  fullNameDisplay: string;
  timeGreeting: string;
}) {
  const t = useT();
  const { isAuthenticated, userProfile, backendUserId } = useApp();
  return (
    <div className="flex shrink-0 items-start pl-3 pr-4 pb-2.5 pt-5">
      <div className="min-w-0 flex-1">
        {isAuthenticated && fullNameDisplay ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <AvatarImage
                src={userProfile?.avatarUrl || DEFAULT_VENDOR_PHOTO}
                alt={fullNameDisplay}
                className="object-cover"
              />
              <AvatarFallback className="bg-brand text-[13px] font-bold text-white">
                {avatarInitials(fullNameDisplay)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <p
                className={cn(
                  "text-[12px] font-semibold leading-tight",
                  isLight ? "text-black" : "text-white/70",
                )}
              >
                {timeGreeting}
              </p>
              <p
                className={cn(
                  "flex flex-wrap items-center gap-1 text-[15px] font-bold leading-snug",
                  isLight ? "text-black" : "text-white",
                )}
              >
                <span className="truncate">{fullNameDisplay}</span>
                <NewAccountBadge
                  visibilityTier={
                    getArtisanProfile(
                      userProfile?.identityId || backendUserId || "",
                    )?.visibilityTier ?? 1
                  }
                  status={
                    getArtisanProfile(
                      userProfile?.identityId || backendUserId || "",
                    )?.status
                  }
                  size="sm"
                  className="text-[8px] leading-none tracking-normal"
                />
              </p>
            </div>
          </div>
        ) : (
          <p
            className="whitespace-nowrap text-[32px] font-black tracking-tight leading-none"
            aria-label={t("brand.name")}
          >
            <span className="text-[#FF6B35]">O</span>
            <span className={isLight ? "text-black" : "text-[#C8C9CD]"}>
              na
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
