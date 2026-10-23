import type { SVGProps } from "react";

interface NoHistoryIllustrationProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Vector illustration matching the Figma Booking History empty state:
 * A seated person reviewing an elongated, cascading receipt tape with floating ledger cards.
 */
export function NoHistoryIllustration({
  className = "w-44 h-40",
  ...props
}: NoHistoryIllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Soft ground shadow */}
      <ellipse
        cx="120"
        cy="178"
        rx="85"
        ry="7"
        className="fill-slate-200/60 dark:fill-white/5"
      />

      {/* Floating background receipt card: Top Left */}
      <g className="opacity-70 dark:opacity-40">
        <rect
          x="32"
          y="36"
          width="36"
          height="26"
          rx="5"
          className="fill-slate-300 dark:fill-zinc-700"
        />
        <line
          x1="38"
          y1="44"
          x2="58"
          y2="44"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="38"
          y1="50"
          x2="52"
          y2="50"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Floating background receipt card: Top Right */}
      <g className="opacity-70 dark:opacity-40">
        <rect
          x="166"
          y="42"
          width="34"
          height="24"
          rx="5"
          className="fill-slate-300 dark:fill-zinc-700"
        />
        <line
          x1="172"
          y1="50"
          x2="190"
          y2="50"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="172"
          y1="56"
          x2="184"
          y2="56"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Small floating sparkles/stars */}
      <path
        d="M 48 22 L 50 26 L 54 28 L 50 30 L 48 34 L 46 30 L 42 28 L 46 26 Z"
        className="fill-slate-300 dark:fill-zinc-600 opacity-60"
      />
      <path
        d="M 194 28 L 195.5 31 L 198.5 32.5 L 195.5 34 L 194 37 L 192.5 34 L 189.5 32.5 L 192.5 31 Z"
        className="fill-slate-300 dark:fill-zinc-600 opacity-60"
      />

      {/* Back cascade of receipt (behind legs) */}
      <path
        d="M 104 98 C 96 112 86 130 68 148 C 50 166 32 172 20 174 C 18 174 24 168 34 162 C 54 150 78 132 94 98 Z"
        className="fill-slate-200 dark:fill-zinc-700"
      />

      {/* Person: Seated Legs (Dark trousers) */}
      {/* Left/Far leg */}
      <path
        d="M 126 128 C 120 134 112 144 105 160 C 103 165 96 172 90 173 C 86 174 88 170 94 165 C 102 153 112 136 122 128 Z"
        className="fill-slate-700 dark:fill-zinc-800"
      />
      {/* Main seated legs and pelvis */}
      <path
        d="M 128 126 C 124 126 116 134 110 148 C 105 160 100 172 108 174 C 118 176 130 160 138 144 C 142 136 138 126 128 126 Z"
        className="fill-slate-800 dark:fill-zinc-900"
      />
      {/* Front bent knee and shin forming the strong sitting wedge */}
      <path
        d="M 118 132 C 114 138 108 152 112 168 C 114 174 122 174 130 168 C 138 162 144 148 144 138 C 144 130 134 128 118 132 Z"
        className="fill-slate-800 dark:fill-zinc-900"
      />
      {/* Small shoe/foot */}
      <ellipse
        cx="105"
        cy="173"
        rx="6"
        ry="3"
        className="fill-slate-900 dark:fill-zinc-950"
      />

      {/* Person: Upper Body / White Top */}
      <path
        d="M 142 98 C 138 98 134 102 132 108 L 126 126 C 128 129 135 131 144 130 C 150 128 154 120 152 110 C 150 102 146 98 142 98 Z"
        className="fill-slate-100 dark:fill-zinc-200 stroke-slate-300 dark:stroke-zinc-600"
        strokeWidth="1"
      />

      {/* Person: Head & Hair (Bun/Ponytail) */}
      {/* Neck */}
      <path
        d="M 137 92 L 137 98 L 142 98 L 142 92 Z"
        className="fill-amber-100 dark:fill-amber-200"
      />
      {/* Face profile looking left & down */}
      <circle
        cx="139"
        cy="86"
        r="8"
        className="fill-amber-100 dark:fill-amber-200"
      />
      {/* Hair covering top & back of head */}
      <path
        d="M 134 83 C 135 78 140 78 145 80 C 148 82 149 87 148 91 C 145 92 142 90 140 88 C 137 87 135 86 134 83 Z"
        className="fill-slate-900 dark:fill-zinc-950"
      />
      {/* High topknot bun */}
      <circle
        cx="146"
        cy="75"
        r="5.5"
        className="fill-slate-900 dark:fill-zinc-950"
      />
      {/* Hair tie */}
      <rect
        x="143"
        y="78"
        width="4"
        height="2.5"
        rx="1"
        className="fill-amber-600"
      />

      {/* Person: Arm & Hand holding the receipt */}
      <path
        d="M 138 102 C 134 105 125 110 118 112 C 114 113 111 112 109 110 C 107 108 109 104 114 102 C 120 100 130 98 136 99 Z"
        className="fill-slate-100 dark:fill-zinc-200 stroke-slate-300 dark:stroke-zinc-600"
        strokeWidth="1"
      />
      {/* Hand fingers */}
      <ellipse
        cx="109"
        cy="109"
        rx="3"
        ry="2.5"
        className="fill-amber-100 dark:fill-amber-200"
      />

      {/* Front Cascading Receipt Tape / Paper Roll */}
      {/* Main ribbon body cascading down from hands */}
      <path
        d="M 108 107 C 102 118 96 134 102 148 C 108 162 122 168 138 168 C 154 168 170 164 184 172 C 190 175 194 177 198 178 C 195 174 186 170 178 167 C 162 161 146 160 132 154 C 118 148 114 136 116 122 C 117 114 114 108 108 107 Z"
        className="fill-white dark:fill-zinc-100 stroke-slate-300 dark:stroke-zinc-400"
        strokeWidth="1.2"
      />

      {/* Inner fold of the receipt tape for depth */}
      <path
        d="M 108 107 C 112 115 116 126 115 138 C 113 146 108 152 102 148 C 98 138 103 120 108 107 Z"
        className="fill-slate-200/90 dark:fill-zinc-300"
      />

      {/* Subtle dashed print lines on the cascading receipt */}
      <g stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
        <line x1="110" y1="120" x2="114" y2="120" />
        <line x1="109" y1="126" x2="114" y2="126" />
        <line x1="112" y1="140" x2="118" y2="142" />
        <line x1="118" y1="152" x2="126" y2="155" />
        <line x1="134" y1="162" x2="144" y2="163" />
        <line x1="152" y1="164" x2="164" y2="164" />
        <line x1="172" y1="168" x2="182" y2="171" />
      </g>
    </svg>
  );
}
