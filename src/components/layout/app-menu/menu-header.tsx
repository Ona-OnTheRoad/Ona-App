import { NewAccountBadge } from "@/components/profile/new-account-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getArtisanProfile } from "@/lib/artisan/local-store";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import { useApp } from "@/lib/store";

/** Greeting + avatar at the top of the dock's More sheet. */
export function MenuHeader({
  fullNameDisplay,
  timeGreeting,
}: {
  fullNameDisplay: string;
  timeGreeting: string;
}) {
  const { isAuthenticated, userProfile, backendUserId } = useApp();
  if (!isAuthenticated || !fullNameDisplay) return null;
  const artisan = getArtisanProfile(
    userProfile?.identityId || backendUserId || "",
  );
  return (
    <div className="flex items-center gap-3 pb-2">
      <Avatar className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
        <AvatarImage
          src={userProfile?.avatarUrl || DEFAULT_VENDOR_PHOTO}
          alt={fullNameDisplay}
          className="object-cover"
        />
        <AvatarFallback className="bg-ona-brand-btn text-[13px] font-bold text-white">
          {avatarInitials(fullNameDisplay)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[12px] font-medium leading-tight text-ona-muted">
          {timeGreeting}
        </p>
        <p className="flex flex-wrap items-center gap-1 text-[15px] font-bold leading-snug text-ona-ink">
          <span className="truncate">{fullNameDisplay}</span>
          <NewAccountBadge
            visibilityTier={artisan?.visibilityTier ?? 1}
            status={artisan?.status}
            size="sm"
            className="text-[8px] leading-none tracking-normal"
          />
        </p>
      </div>
    </div>
  );
}
