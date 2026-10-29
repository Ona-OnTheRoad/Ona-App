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
      {/* Light mode illustration */}
      <g className="dark:hidden">
        {/* Soft ground shadow */}
        <ellipse
          cx="120"
          cy="178"
          rx="85"
          ry="7"
          className="fill-slate-200/60"
        />

        {/* Floating background receipt card: Top Left */}
        <g className="opacity-70">
          <rect
            x="32"
            y="36"
            width="36"
            height="26"
            rx="5"
            className="fill-slate-300"
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
        <g className="opacity-70">
          <rect
            x="166"
            y="42"
            width="34"
            height="24"
            rx="5"
            className="fill-slate-300"
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
          className="fill-slate-300 opacity-60"
        />
        <path
          d="M 194 28 L 195.5 31 L 198.5 32.5 L 195.5 34 L 194 37 L 192.5 34 L 189.5 32.5 L 192.5 31 Z"
          className="fill-slate-300 opacity-60"
        />

        {/* Back cascade of receipt (behind legs) */}
        <path
          d="M 104 98 C 96 112 86 130 68 148 C 50 166 32 172 20 174 C 18 174 24 168 34 162 C 54 150 78 132 94 98 Z"
          className="fill-slate-200"
        />

        {/* Person: Seated Legs (Dark trousers) */}
        <path
          d="M 126 128 C 120 134 112 144 105 160 C 103 165 96 172 90 173 C 86 174 88 170 94 165 C 102 153 112 136 122 128 Z"
          className="fill-slate-700"
        />
        <path
          d="M 128 126 C 124 126 116 134 110 148 C 105 160 100 172 108 174 C 118 176 130 160 138 144 C 142 136 138 126 128 126 Z"
          className="fill-slate-800"
        />
        <path
          d="M 118 132 C 114 138 108 152 112 168 C 114 174 122 174 130 168 C 138 162 144 148 144 138 C 144 130 134 128 118 132 Z"
          className="fill-slate-800"
        />
        <ellipse
          cx="105"
          cy="173"
          rx="6"
          ry="3"
          className="fill-slate-900"
        />

        {/* Person: Upper Body / White Top */}
        <path
          d="M 142 98 C 138 98 134 102 132 108 L 126 126 C 128 129 135 131 144 130 C 150 128 154 120 152 110 C 150 102 146 98 142 98 Z"
          className="fill-slate-100 stroke-slate-300"
          strokeWidth="1"
        />

        {/* Person: Head & Hair (Bun/Ponytail) */}
        <path
          d="M 137 92 L 137 98 L 142 98 L 142 92 Z"
          className="fill-amber-100"
        />
        <circle
          cx="139"
          cy="86"
          r="8"
          className="fill-amber-100"
        />
        <path
          d="M 134 83 C 135 78 140 78 145 80 C 148 82 149 87 148 91 C 145 92 142 90 140 88 C 137 87 135 86 134 83 Z"
          className="fill-slate-900"
        />
        <circle
          cx="146"
          cy="75"
          r="5.5"
          className="fill-slate-900"
        />
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
          className="fill-slate-100 stroke-slate-300"
          strokeWidth="1"
        />
        <ellipse
          cx="109"
          cy="109"
          rx="3"
          ry="2.5"
          className="fill-amber-100"
        />

        {/* Front Cascading Receipt Tape / Paper Roll */}
        <path
          d="M 108 107 C 102 118 96 134 102 148 C 108 162 122 168 138 168 C 154 168 170 164 184 172 C 190 175 194 177 198 178 C 195 174 186 170 178 167 C 162 161 146 160 132 154 C 118 148 114 136 116 122 C 117 114 114 108 108 107 Z"
          className="fill-white stroke-slate-300"
          strokeWidth="1.2"
        />
        <path
          d="M 108 107 C 112 115 116 126 115 138 C 113 146 108 152 102 148 C 98 138 103 120 108 107 Z"
          className="fill-slate-200/90"
        />
        <g stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
          <line x1="110" y1="120" x2="114" y2="120" />
          <line x1="109" y1="126" x2="114" y2="126" />
          <line x1="112" y1="140" x2="118" y2="142" />
          <line x1="118" y1="152" x2="126" y2="155" />
          <line x1="134" y1="162" x2="144" y2="163" />
          <line x1="152" y1="164" x2="164" y2="164" />
          <line x1="172" y1="168" x2="182" y2="171" />
        </g>
      </g>

      {/* Dark mode illustration */}
      <g className="hidden dark:block">
        <defs>
          <linearGradient id="noHistCircleGrad" x1="126" y1="24" x2="126" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E4E4E7" />
            <stop offset="65%" stopColor="#A1A1AA" />
            <stop offset="100%" stopColor="#52525B" />
          </linearGradient>
          <linearGradient id="noHistScrollBack" x1="100" y1="70" x2="90" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4D4D8" />
            <stop offset="100%" stopColor="#52525B" />
          </linearGradient>
        </defs>

        {/* Main circular gradient backdrop */}
        <circle cx="126" cy="96" r="70" fill="url(#noHistCircleGrad)" />

        {/* Floating checklist badge 1: Top Left */}
        <g>
          <rect x="65" y="25" width="26" height="10" rx="1.5" fill="#D4D4D8" />
          <path d="M 68.5 30 L 70 31.5 L 73 28.5" stroke="#52525B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="75.5" y1="30" x2="87" y2="30" stroke="#FAFAFA" strokeWidth="1.3" strokeLinecap="round" />
        </g>

        {/* Floating checklist badge 2: Mid-Top Left */}
        <g>
          <rect x="49" y="43" width="32" height="12" rx="1.5" fill="#D4D4D8" />
          <path d="M 53 49 L 54.8 50.8 L 58 47.5" stroke="#52525B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="61" y1="49" x2="77" y2="49" stroke="#FAFAFA" strokeWidth="1.3" strokeLinecap="round" />
        </g>

        {/* Floating checklist badge 3: Top Right */}
        <g>
          <rect x="167" y="43" width="32" height="12" rx="1.5" fill="#D4D4D8" />
          <path d="M 171 49 L 172.8 50.8 L 176 47.5" stroke="#52525B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="179" y1="49" x2="195" y2="49" stroke="#FAFAFA" strokeWidth="1.3" strokeLinecap="round" />
        </g>

        {/* Small vertical accent stem on bottom left */}
        <rect x="33" y="152" width="3" height="22" rx="1" fill="#A1A1AA" />

        {/* Seated Person: Dark grey trousers/legs */}
        <path
          d="M 148 134 L 95 162 L 60 160 L 58 173 L 106 173 L 154 152 Z"
          fill="#3F3F46"
        />
        {/* Left shoe/foot */}
        <path d="M 58 160 L 49 156 L 49 173 L 58 173 Z" fill="#52525B" />

        {/* Person: Upper Body / White Sweater */}
        <path
          d="M 140 82 C 154 82 162 94 162 114 L 160 138 L 135 138 L 135 96 C 135 88 137 82 140 82 Z"
          fill="#FAFAFA"
        />
        {/* Inner arm shadow holding the scroll */}
        <path
          d="M 135 92 L 116 98 L 118 118 L 138 122 Z"
          fill="#D4D4D8"
        />
        {/* Forearm & sleeve */}
        <path
          d="M 146 92 C 152 96 154 114 148 128 L 122 114 L 126 104 L 142 112 Z"
          fill="#FFFFFF"
        />

        {/* Person: Head, Glasses & High Bun */}
        <path d="M 136 68 L 145 68 L 146 83 L 135 83 Z" fill="#E4E4E7" />
        <ellipse cx="137" cy="64" rx="8.5" ry="10" fill="#E4E4E7" />
        <circle cx="130" cy="64" r="2.6" stroke="#27272A" strokeWidth="1" fill="none" />
        <line x1="132.5" y1="63.5" x2="136" y2="62.5" stroke="#27272A" strokeWidth="1" />
        <path
          d="M 131 56 C 134 51 143 52 147 58 C 150 63 149 71 144 73 C 143 66 139 61 131 56 Z"
          fill="#18181B"
        />
        <circle cx="148" cy="46" r="7.5" fill="#18181B" />

        {/* Giant Cascading Checklist Scroll */}
        <path
          d="M 103 72 C 114 72 122 86 122 108 C 122 132 134 156 158 164 L 132 168 C 110 160 100 134 100 106 C 100 86 96 72 103 72 Z"
          fill="url(#noHistScrollBack)"
        />
        <path
          d="M 103 72 C 92 72 86 96 82 122 C 77 148 66 168 48 174 L 74 174 C 90 166 100 144 105 116 C 109 92 112 72 103 72 Z"
          fill="#FAFAFA"
        />
        <path
          d="M 115 76 C 108 82 106 104 112 128 C 118 152 136 168 164 166 C 178 165 190 166 202 174 L 178 174 C 166 168 154 168 142 168 C 118 168 104 146 102 114 C 100 90 106 72 115 76 Z"
          fill="#E4E4E7"
        />
        <g stroke="#A1A1AA" strokeWidth="1.2" strokeLinecap="round">
          <line x1="96" y1="84" x2="104" y2="84" />
          <line x1="93" y1="94" x2="102" y2="94" />
          <line x1="91" y1="104" x2="100" y2="104" />
          <line x1="89" y1="114" x2="98" y2="114" />
          <line x1="87" y1="124" x2="96" y2="124" />
          <line x1="84" y1="134" x2="93" y2="134" />
          <line x1="80" y1="144" x2="89" y2="144" />
          <line x1="75" y1="154" x2="84" y2="154" />
          <line x1="68" y1="164" x2="77" y2="164" />
        </g>
      </g>
    </svg>
  );
}
