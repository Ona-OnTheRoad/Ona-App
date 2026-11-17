import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  xs: "h-4 w-auto",
  sm: "h-5 w-auto",
  md: "h-6 w-auto",
  lg: "h-8 w-auto",
  xl: "h-10 w-auto",
} as const;

export type OnaLogoSize = keyof typeof SIZE_CLASSES;

/**
 * Reusable geometric "Ona." brand logo SVG.
 * Uses `currentColor` for the wordmark so it adapts to light/dark themes,
 * and brand orange (#FF6B00) for the dot.
 */
export function OnaLogo({
  size = "md",
  className,
  dotClassName,
  label = "Ona",
}: {
  size?: OnaLogoSize;
  className?: string;
  dotClassName?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 74"
      role="img"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 select-none text-ona-ink",
        SIZE_CLASSES[size],
        className,
      )}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Geometric O */}
      <circle
        cx="37"
        cy="37"
        r="27.25"
        stroke="currentColor"
        strokeWidth="17.5"
      />
      {/* Geometric n */}
      <path
        d="M 82 72 L 82 47 A 28 28 0 0 1 138 47 L 138 72 L 121.5 72 L 121.5 47 A 11.5 11.5 0 0 0 98.5 47 L 98.5 72 Z"
        fill="currentColor"
      />
      {/* Geometric a */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 199 19 L 199 72 L 183 72 L 183 69.83 A 26.5 26.5 0 1 1 183 21.17 L 183 19 Z M 172.5 35 A 10.5 10.5 0 1 0 172.5 56 A 10.5 10.5 0 1 0 172.5 35 Z"
        fill="currentColor"
      />
      {/* Orange dot */}
      <circle
        cx="222.5"
        cy="59.5"
        r="12.5"
        className={cn("fill-[#FF6B00]", dotClassName)}
      />
    </svg>
  );
}
