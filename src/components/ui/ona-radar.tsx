"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export type OnaRadarDot = {
  id: string;
  name?: string | null;
  photoUrl?: string | null;
  /** The pro currently being requested. */
  highlight?: boolean;
};

/** Fixed angles (deg, 0 = top, clockwise) for the dots on the outer ring. */
const DOT_ANGLES = [-38, 62, 215, 300];

/**
 * Decorative radar: thin outer ring, filled mid circle, lighter inner area,
 * coral disc with a magnifier, rotating translucent sweep wedge and round
 * avatar dots on the outer ring. Hidden from assistive tech; the sweep stops
 * under prefers-reduced-motion (globals.css).
 */
export function OnaRadar({
  dots = [],
  size = 280,
}: {
  dots?: OnaRadarDot[];
  size?: number;
}) {
  const dot = Math.round(size * 0.12);
  return (
    <div
      aria-hidden
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-full border border-white/10" />
      <span className="absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
      <span className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.05]" />
      <span
        className="o-radar-sweep absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(60,160,105,0) 0deg, rgba(60,160,105,0) 290deg, rgba(60,160,105,0.38) 355deg, rgba(60,160,105,0.38) 360deg)",
        }}
      />
      <span className="absolute left-1/2 top-1/2 flex h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ona-brand">
        <span className="flex h-[58%] w-[58%] items-center justify-center rounded-full bg-[#fbeee9] text-ona-dark">
          <Search className="h-[52%] w-[52%]" strokeWidth={2.25} />
        </span>
      </span>
      {dots.slice(0, DOT_ANGLES.length).map((d, i) => {
        const a = (DOT_ANGLES[i] * Math.PI) / 180;
        const r = 50;
        return (
          <span
            key={d.id}
            className="absolute"
            style={{
              left: `${50 + r * Math.sin(a)}%`,
              top: `${50 - r * Math.cos(a)}%`,
              width: dot,
              height: dot,
              transform: "translate(-50%,-50%)",
            }}
          >
            <Avatar
              className={cn(
                "h-full w-full border-2",
                d.highlight ? "border-ona-brand" : "border-white/80",
              )}
            >
              <AvatarImage src={d.photoUrl || undefined} alt="" />
              <AvatarFallback className="text-[10px]">
                {(d.name || "?").trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </span>
        );
      })}
    </div>
  );
}
