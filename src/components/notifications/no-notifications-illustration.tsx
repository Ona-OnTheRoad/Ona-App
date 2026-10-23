import type { SVGProps } from "react";

interface NoNotificationsIllustrationProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Vector illustration matching the Figma Notifications empty state:
 * A standing character pondering with three floating question marks around them.
 */
export function NoNotificationsIllustration({
  className = "w-44 h-40",
  ...props
}: NoNotificationsIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Ground shadow beneath feet */}
      <ellipse
        cx="100"
        cy="166"
        rx="36"
        ry="4.5"
        className="fill-slate-200 dark:fill-white/10"
      />

      {/* --- Floating Question Marks --- */}
      {/* 1. Large Question Mark (Top Left) */}
      <g className="fill-slate-600 dark:fill-slate-300">
        <path d="M 60 45 C 57.5 45 55.4 45.8 53.8 47.4 C 52.2 49 51.5 51.1 51.5 53.6 H 55.8 C 55.8 52.3 56.2 51.2 57 50.4 C 57.8 49.6 58.8 49.2 60 49.2 C 61.2 49.2 62.2 49.6 63 50.4 C 63.8 51.2 64.2 52.2 64.2 53.4 C 64.2 54.4 63.9 55.3 63.2 56.1 C 62.5 56.9 61.5 57.8 60.2 58.8 C 58.7 60 57.6 61.2 56.8 62.4 C 56.1 63.6 55.7 65.1 55.7 66.8 H 60 C 60 65.6 60.3 64.6 60.9 63.7 C 61.5 62.8 62.5 61.8 63.9 60.7 C 65.4 59.5 66.6 58.3 67.4 57.1 C 68.2 55.9 68.6 54.5 68.6 53.1 C 68.6 50.7 67.8 48.7 66.2 47.2 C 64.6 45.7 62.5 45 60 45 Z" />
        <circle cx="58" cy="73" r="2.4" />
      </g>

      {/* 2. Medium Question Mark (Top Center-Right) */}
      <g className="fill-slate-400 dark:fill-slate-400">
        <path d="M 124 24 C 122 24 120.3 24.6 119 25.8 C 117.7 27 117.1 28.6 117.1 30.6 H 120.5 C 120.5 29.5 120.8 28.6 121.5 28 C 122.1 27.4 122.9 27.1 124 27.1 C 125 27.1 125.8 27.4 126.4 28 C 127 28.6 127.3 29.4 127.3 30.4 C 127.3 31.2 127 31.9 126.5 32.5 C 126 33.1 125.2 33.8 124.1 34.7 C 122.9 35.7 122 36.6 121.4 37.6 C 120.8 38.6 120.5 39.8 120.5 41.2 H 124 C 124 40.2 124.2 39.4 124.7 38.7 C 125.2 38 126 37.2 127.1 36.3 C 128.3 35.3 129.2 34.3 129.8 33.3 C 130.4 32.3 130.8 31.2 130.8 30.1 C 130.8 28.2 130.2 26.6 128.9 25.5 C 127.6 24.4 126 24 124 24 Z" />
        <circle cx="122.3" cy="46" r="2" />
      </g>

      {/* 3. Small Question Mark (Mid Right) */}
      <g className="fill-slate-300 dark:fill-slate-500">
        <path d="M 148 64 C 146.5 64 145.2 64.5 144.2 65.4 C 143.2 66.3 142.7 67.5 142.7 69.1 H 145.3 C 145.3 68.2 145.6 67.5 146.1 67 C 146.6 66.5 147.2 66.3 148 66.3 C 148.8 66.3 149.4 66.5 149.9 67 C 150.4 67.5 150.6 68.1 150.6 68.9 C 150.6 69.5 150.4 70.1 150 70.6 C 149.6 71.1 149 71.7 148.1 72.4 C 147.2 73.2 146.5 73.9 146 74.7 C 145.5 75.5 145.3 76.5 145.3 77.6 H 148 C 148 76.8 148.2 76.2 148.6 75.6 C 149 75 149.6 74.4 150.5 73.7 C 151.4 72.9 152.1 72.1 152.6 71.3 C 153.1 70.5 153.3 69.6 153.3 68.7 C 153.3 67.2 152.8 66 151.8 65.1 C 150.8 64.3 149.5 64 148 64 Z" />
        <circle cx="146.7" cy="81.5" r="1.6" />
      </g>

      {/* --- Standing Character --- */}
      {/* Head / Hair / Neck */}
      {/* Hair (back of head) */}
      <ellipse
        cx="100"
        cy="49"
        rx="9.5"
        ry="10.5"
        className="fill-slate-900 dark:fill-zinc-950"
      />
      {/* Face oval */}
      <ellipse
        cx="99.5"
        cy="51"
        rx="7.5"
        ry="8"
        className="fill-amber-100 dark:fill-amber-200"
      />
      {/* Hair styling / fringe */}
      <path
        d="M 92 48 C 93 42 97 40 102 40 C 107 40 110 43 109 47 C 106 45 101 45 96 48 Z"
        className="fill-slate-900 dark:fill-zinc-950"
      />
      {/* Neck */}
      <rect
        x="97"
        y="58"
        width="5"
        height="6"
        className="fill-amber-100 dark:fill-amber-200"
      />

      {/* Torso: Light Grey Shirt */}
      <path
        d="M 91 64 C 95 62 104 62 108 64 L 115 74 L 111 80 L 109 76 L 109 104 C 103 105 96 105 90 104 L 90 76 L 88 80 L 84 74 Z"
        className="fill-slate-200 dark:fill-zinc-700 stroke-slate-300 dark:stroke-zinc-600"
        strokeWidth="0.8"
      />

      {/* Arms resting at sides */}
      {/* Left arm */}
      <path
        d="M 85 74 L 88 95 L 92 98 L 92 102 L 87 97 L 83 77 Z"
        className="fill-slate-200 dark:fill-zinc-700"
      />
      {/* Left hand */}
      <ellipse
        cx="92.5"
        cy="102"
        rx="2"
        ry="2.5"
        className="fill-amber-100 dark:fill-amber-200"
      />

      {/* Right arm */}
      <path
        d="M 114 74 L 111 95 L 107 98 L 107 102 L 112 97 L 116 77 Z"
        className="fill-slate-200 dark:fill-zinc-700"
      />
      {/* Right hand */}
      <ellipse
        cx="106.5"
        cy="102"
        rx="2"
        ry="2.5"
        className="fill-amber-100 dark:fill-amber-200"
      />

      {/* Legs: Dark Charcoal Trousers */}
      {/* Left leg */}
      <path
        d="M 91 104 L 91 154 L 96.5 154 L 98.5 116 L 99 104 Z"
        className="fill-slate-900 dark:fill-zinc-950"
      />
      {/* Right leg */}
      <path
        d="M 100 104 L 100.5 116 L 102.5 154 L 108 154 L 108 104 Z"
        className="fill-slate-900 dark:fill-zinc-950"
      />

      {/* Shoes */}
      {/* Left shoe */}
      <path
        d="M 88.5 158 C 88.5 155.5 91 154 96.5 154 L 97 158 Z"
        className="fill-slate-950 dark:fill-black"
      />
      <ellipse
        cx="92.5"
        cy="158"
        rx="5"
        ry="2"
        className="fill-slate-950 dark:fill-black"
      />
      {/* Right shoe */}
      <path
        d="M 102 154 C 107.5 154 110.5 155.5 110.5 158 L 102 158 Z"
        className="fill-slate-950 dark:fill-black"
      />
      <ellipse
        cx="106.5"
        cy="158"
        rx="5"
        ry="2"
        className="fill-slate-950 dark:fill-black"
      />
    </svg>
  );
}
