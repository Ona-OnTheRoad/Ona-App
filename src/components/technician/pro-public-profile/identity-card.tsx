import { BadgeCheck, Wrench } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineStatusDot } from "@/components/ui/online-status-dot";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Stat } from "@/components/technician/pro-public-profile/parts";
import type { PublicProfileTheme } from "@/components/technician/pro-public-profile/theme";
import { avatarInitials } from "@/lib/brand";
import type { Technician } from "@/lib/types";
import { cn, formatDistance, formatEta } from "@/lib/utils";

export function PublicIdentityCard({
  tech,
  isLight,
  theme,
  skillLabel,
  photoSrc,
  statusText,
}: {
  tech: Technician;
  isLight: boolean;
  theme: PublicProfileTheme;
  skillLabel: string;
  photoSrc: string;
  statusText: string | null;
}) {
  const { card, cardBg, inset, insetBg, ink, muted, soft } = theme;
  return (
    <section
      className={cn(
        isLight ? "rounded-none px-0 py-3" : "rounded-2xl p-3",
        card,
      )}
      style={isLight ? undefined : { backgroundColor: cardBg }}
    >
      <div className="flex items-center gap-3">
        <Avatar
          className={cn(
            "h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-full border-0 shadow-none ring-0",
            inset,
          )}
          style={isLight ? undefined : { backgroundColor: insetBg }}
        >
          <AvatarImage
            src={photoSrc}
            alt={tech.name}
            className="h-full w-full scale-100 object-cover object-center"
          />
          <AvatarFallback className="bg-brand text-sm font-bold text-white">
            {avatarInitials(tech.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "flex items-center gap-1 text-[17px] font-black leading-tight tracking-tight",
              ink,
            )}
          >
            <span className="truncate">{tech.name}</span>
            {tech.verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-sky-500"
                strokeWidth={2.25}
              />
            )}
          </p>

          {tech.businessName ? (
            <p
              className={cn("mt-0.5 truncate text-[12px] font-semibold", soft)}
            >
              {tech.businessName}
            </p>
          ) : null}

          <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-brand">
            <Wrench className="h-3 w-3" strokeWidth={2.4} />
            {skillLabel}
          </p>

          <p
            className={cn(
              "mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold",
              muted,
            )}
          >
            {tech.status === "available" ? (
              <OnlineStatusDot status="available" />
            ) : (
              <span
                className={cn(
                  "font-bold",
                  tech.status === "busy" && "text-[#FF6B35]",
                )}
              >
                {statusText}
              </span>
            )}
            {tech.verified ? (
              <span className="text-sky-500"> · Verified</span>
            ) : null}
            {tech.fastResponse ? " · Fast reply" : ""}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-2 grid grid-cols-3 gap-0 py-1.5 text-center",
          isLight ? "rounded-none" : "rounded-xl",
          inset,
        )}
        style={isLight ? undefined : { backgroundColor: insetBg }}
      >
        <Stat
          isLight={isLight}
          label={
            tech.reviewCount > 0 ? `${tech.reviewCount} reviews` : "Reviews"
          }
          value={
            <StarRatingDisplay
              rating={tech.rating > 0 ? tech.rating : 0}
              size="sm"
              className="justify-center"
            />
          }
        />
        <Stat
          isLight={isLight}
          label="ETA"
          value={formatEta(tech.etaMinutes)}
        />
        <Stat
          isLight={isLight}
          label="Distance"
          value={formatDistance(tech.distanceKm)}
        />
      </div>
    </section>
  );
}
