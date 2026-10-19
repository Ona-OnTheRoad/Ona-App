"use client";

import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

/**
 * Decorative radar: concentric rings, rotating sweep wedge, coral centre disc.
 * `photoUrl` (the pro currently being requested, when known) is shown as a dot.
 * Purely visual: hidden from assistive tech, animations stop under
 * prefers-reduced-motion.
 */
export function OnaRadar({
  photoUrl,
  name,
  size = 260,
}: {
  photoUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size }}
    >
      {[100, 72, 46].map((p) => (
        <span
          key={p}
          className="absolute left-1/2 top-1/2 rounded-full border border-white/15"
          style={{
            width: `${p}%`,
            height: `${p}%`,
            transform: "translate(-50%,-50%)",
            background: p === 100 ? "rgba(255,255,255,0.03)" : undefined,
          }}
        />
      ))}
      <span
        className="o-radar-sweep absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(76,195,138,0) 0deg, rgba(76,195,138,0) 300deg, rgba(76,195,138,0.32) 360deg)",
        }}
      />
      <span className="o-radar-pulse absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ona-brand" />
      <span className="absolute left-1/2 top-1/2 flex h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ona-brand text-white shadow-[0_0_0_10px_rgba(226,101,79,0.25)]">
        <Search className="h-[38%] w-[38%]" strokeWidth={2.25} />
      </span>
      {photoUrl ? (
        <span className="absolute right-[6%] top-[22%]">
          <Avatar className="h-8 w-8 border-2 border-white/80">
            <AvatarImage src={photoUrl} alt="" />
            <AvatarFallback>
              {(name || "?").trim().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </span>
      ) : null}
    </div>
  );
}
