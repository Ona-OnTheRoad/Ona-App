import type { ReactElement } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface Props {
  photo: string | null | undefined;
  name: string;
  subtitle: string;
  ink: string;
  muted: string;
}

/** Counter-party avatar + name + caption (customer for pros, pro for customers). */
export function AgreedPartyRow({
  photo,
  name,
  subtitle,
  ink,
  muted,
}: Props): ReactElement {
  return (
    <div className="mb-3 flex items-center gap-3 px-1">
      <Avatar className="h-12 w-12 rounded-full">
        <AvatarImage
          src={photo || DEFAULT_VENDOR_PHOTO}
          className="object-cover"
        />
        <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={cn("truncate text-[15px] font-black", ink)}>{name}</p>
        <p className={cn("text-[12px] font-semibold", muted)}>{subtitle}</p>
      </div>
    </div>
  );
}
