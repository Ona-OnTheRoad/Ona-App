"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Dock icon for the Profile tab: the signed-in person's photo (round, ringed in the
 * accent colour while the tab is active), or the generic profile glyph when there is
 * no photo or it fails to load.
 */
export function ProfileDockIcon({ className }: { className?: string }) {
  const { userProfile } = useApp();
  const [failed, setFailed] = useState(false);
  const src = userProfile?.avatarUrl;
  if (!src || failed) return <UserRound className={className} />;
  const active = Boolean(className?.includes("--active"));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      className={cn(
        className,
        "rounded-full object-cover",
        active
          ? "ring-2 ring-[var(--rfd-accent)]"
          : "ring-1 ring-[var(--rfd-border)]",
      )}
    />
  );
}
