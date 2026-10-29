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
      {/* Light mode illustration */}
      <g className="dark:hidden">
        <ellipse
          cx="100"
          cy="166"
          rx="36"
          ry="4.5"
          className="fill-slate-200"
        />
        <g className="fill-slate-600">
          <path d="M 60 45 C 57.5 45 55.4 45.8 53.8 47.4 C 52.2 49 51.5 51.1 51.5 53.6 H 55.8 C 55.8 52.3 56.2 51.2 57 50.4 C 57.8 49.6 58.8 49.2 60 49.2 C 61.2 49.2 62.2 49.6 63 50.4 C 63.8 51.2 64.2 52.2 64.2 53.4 C 64.2 54.4 63.9 55.3 63.2 56.1 C 62.5 56.9 61.5 57.8 60.2 58.8 C 58.7 60 57.6 61.2 56.8 62.4 C 56.1 63.6 55.7 65.1 55.7 66.8 H 60 C 60 65.6 60.3 64.6 60.9 63.7 C 61.5 62.8 62.5 61.8 63.9 60.7 C 65.4 59.5 66.6 58.3 67.4 57.1 C 68.2 55.9 68.6 54.5 68.6 53.1 C 68.6 50.7 67.8 48.7 66.2 47.2 C 64.6 45.7 62.5 45 60 45 Z" />
          <circle cx="58" cy="73" r="2.4" />
        </g>
        <g className="fill-slate-400">
          <path d="M 124 24 C 122 24 120.3 24.6 119 25.8 C 117.7 27 117.1 28.6 117.1 30.6 H 120.5 C 120.5 29.5 120.8 28.6 121.5 28 C 122.1 27.4 122.9 27.1 124 27.1 C 125 27.1 125.8 27.4 126.4 28 C 127 28.6 127.3 29.4 127.3 30.4 C 127.3 31.2 127 31.9 126.5 32.5 C 126 33.1 125.2 33.8 124.1 34.7 C 122.9 35.7 122 36.6 121.4 37.6 C 120.8 38.6 120.5 39.8 120.5 41.2 H 124 C 124 40.2 124.2 39.4 124.7 38.7 C 125.2 38 126 37.2 127.1 36.3 C 128.3 35.3 129.2 34.3 129.8 33.3 C 130.4 32.3 130.8 31.2 130.8 30.1 C 130.8 28.2 130.2 26.6 128.9 25.5 C 127.6 24.4 126 24 124 24 Z" />
          <circle cx="122.3" cy="46" r="2" />
        </g>
        <g className="fill-slate-300">
          <path d="M 148 64 C 146.5 64 145.2 64.5 144.2 65.4 C 143.2 66.3 142.7 67.5 142.7 69.1 H 145.3 C 145.3 68.2 145.6 67.5 146.1 67 C 146.6 66.5 147.2 66.3 148 66.3 C 148.8 66.3 149.4 66.5 149.9 67 C 150.4 67.5 150.6 68.1 150.6 68.9 C 150.6 69.5 150.4 70.1 150 70.6 C 149.6 71.1 149 71.7 148.1 72.4 C 147.2 73.2 146.5 73.9 146 74.7 C 145.5 75.5 145.3 76.5 145.3 77.6 H 148 C 148 76.8 148.2 76.2 148.6 75.6 C 149 75 149.6 74.4 150.5 73.7 C 151.4 72.9 152.1 72.1 152.6 71.3 C 153.1 70.5 153.3 69.6 153.3 68.7 C 153.3 67.2 152.8 66 151.8 65.1 C 150.8 64.3 149.5 64 148 64 Z" />
          <circle cx="146.7" cy="81.5" r="1.6" />
        </g>
        <ellipse
          cx="100"
          cy="49"
          rx="9.5"
          ry="10.5"
          className="fill-slate-900"
        />
        <ellipse
          cx="99.5"
          cy="51"
          rx="7.5"
          ry="8"
          className="fill-amber-100"
        />
        <path
          d="M 92 48 C 93 42 97 40 102 40 C 107 40 110 43 109 47 C 106 45 101 45 96 48 Z"
          className="fill-slate-900"
        />
        <rect
          x="97"
          y="58"
          width="5"
          height="6"
          className="fill-amber-100"
        />
        <path
          d="M 91 64 C 95 62 104 62 108 64 L 115 74 L 111 80 L 109 76 L 109 104 C 103 105 96 105 90 104 L 90 76 L 88 80 L 84 74 Z"
          className="fill-slate-200 stroke-slate-300"
          strokeWidth="0.8"
        />
        <path
          d="M 85 74 L 88 95 L 92 98 L 92 102 L 87 97 L 83 77 Z"
          className="fill-slate-200"
        />
        <ellipse
          cx="92.5"
          cy="102"
          rx="2"
          ry="2.5"
          className="fill-amber-100"
        />
        <path
          d="M 114 74 L 111 95 L 107 98 L 107 102 L 112 97 L 116 77 Z"
          className="fill-slate-200"
        />
        <ellipse
          cx="106.5"
          cy="102"
          rx="2"
          ry="2.5"
          className="fill-amber-100"
        />
        <path
          d="M 91 104 L 91 154 L 96.5 154 L 98.5 116 L 99 104 Z"
          className="fill-slate-900"
        />
        <path
          d="M 100 104 L 100.5 116 L 102.5 154 L 108 154 L 108 104 Z"
          className="fill-slate-900"
        />
        <path
          d="M 88.5 158 C 88.5 155.5 91 154 96.5 154 L 97 158 Z"
          className="fill-slate-950"
        />
        <ellipse
          cx="92.5"
          cy="158"
          rx="5"
          ry="2"
          className="fill-slate-950"
        />
        <path
          d="M 102 154 C 107.5 154 110.5 155.5 110.5 158 L 102 158 Z"
          className="fill-slate-950"
        />
        <ellipse
          cx="106.5"
          cy="158"
          rx="5"
          ry="2"
          className="fill-slate-950"
        />
      </g>

      {/* Dark mode illustration */}
      <g className="hidden dark:block">
        <defs>
          <clipPath id="noNotifCircleClip">
            <circle cx="100" cy="84" r="54" />
          </clipPath>
          <linearGradient id="noNotifHillGrad" x1="100" y1="88" x2="100" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4D4D8" />
            <stop offset="100%" stopColor="#E4E4E7" />
          </linearGradient>
        </defs>

        {/* Main light-grey circular backdrop */}
        <circle cx="100" cy="84" r="54" fill="#EDEDEF" />

        {/* Subtle rolling hill inside the bottom half of the circle */}
        <g clipPath="url(#noNotifCircleClip)">
          <path
            d="M 38 104 C 62 96 84 102 106 104 C 128 106 146 95 164 102 L 164 145 L 38 145 Z"
            fill="url(#noNotifHillGrad)"
            opacity="0.75"
          />
        </g>

        {/* Ground shadow beneath feet */}
        <ellipse
          cx="100"
          cy="163"
          rx="28"
          ry="3.5"
          className="fill-white/10"
        />

        {/* Left Question Mark */}
        <g fill="#A1A1AA">
          <path d="M 63 45 C 59.5 45 56.8 46.2 55 48.4 C 53.3 50.5 52.8 53 53.2 55.6 L 57.6 55.2 C 57.4 53.4 57.8 51.9 58.8 50.8 C 59.8 49.7 61.2 49.1 62.9 49.1 C 64.6 49.1 65.9 49.6 66.9 50.6 C 67.9 51.6 68.3 52.9 68.1 54.4 C 67.9 55.7 67.3 56.8 66.2 57.8 C 65.1 58.8 63.8 59.8 62.3 61 C 60.5 62.4 59.3 63.8 58.6 65.2 C 57.9 66.6 57.6 68.3 57.7 70.3 L 62.1 70.1 C 62 68.6 62.3 67.3 63 66.2 C 63.7 65.1 64.9 64 66.6 62.7 C 68.5 61.3 70 59.9 71 58.4 C 72 56.9 72.6 55.2 72.8 53.4 C 73 50.5 72.1 48.2 70.2 46.6 C 68.3 45.3 65.9 45 63 45 Z" />
          <circle cx="60" cy="76.5" r="2.6" />
        </g>

        {/* Right Question Mark */}
        <g fill="#A1A1AA">
          <path d="M 137 64 C 134.2 64 132 64.9 130.5 66.6 C 129.1 68.2 128.6 70.2 128.9 72.2 L 132.5 71.9 C 132.3 70.5 132.7 69.3 133.5 68.5 C 134.3 67.6 135.4 67.2 136.8 67.2 C 138.2 67.2 139.3 67.6 140.1 68.4 C 140.9 69.2 141.2 70.2 141 71.4 C 140.9 72.4 140.4 73.3 139.5 74.1 C 138.6 74.9 137.5 75.7 136.3 76.6 C 134.9 77.7 133.9 78.8 133.3 79.9 C 132.7 81 132.5 82.4 132.6 84 L 136.2 83.8 C 136.1 82.6 136.4 81.6 137 80.7 C 137.6 79.8 138.5 78.9 139.9 77.9 C 141.4 76.8 142.6 75.7 143.4 74.5 C 144.2 73.3 144.7 72 144.9 70.6 C 145.1 68.3 144.4 66.5 142.8 65.2 C 141.3 64.2 139.3 64 137 64 Z" />
          <circle cx="134.5" cy="89" r="2.1" />
        </g>

        {/* Standing Character */}
        <path d="M 98 44 L 98 53 L 103 53 L 103 44 Z" fill="#D4D4D8" />
        <circle cx="100.5" cy="40" r="6.5" fill="#D4D4D8" />
        <path
          d="M 94 39 C 94 34 98 32 103 33 C 106 34 108 37 107 40 C 105 38 102 37 99 38 C 97 39 95 40 94 39 Z"
          fill="#27272A"
        />
        <path
          d="M 90 52 C 95 50 106 50 111 52 L 118 68 L 113 71 L 109 61 L 109 86 L 92 86 L 92 61 L 86 76 L 81 74 Z"
          fill="#FAFAFA"
          stroke="#E4E4E7"
          strokeWidth="0.8"
        />
        <g fill="#D4D4D8">
          <circle cx="96" cy="57" r="1" />
          <circle cx="102" cy="57" r="1" />
          <circle cx="106" cy="61" r="1" />
          <circle cx="99" cy="63" r="1" />
          <circle cx="95" cy="67" r="1" />
          <circle cx="104" cy="68" r="1" />
          <circle cx="98" cy="73" r="1" />
          <circle cx="105" cy="75" r="1" />
          <circle cx="95" cy="79" r="1" />
          <circle cx="102" cy="81" r="1" />
        </g>
        <path
          d="M 111 52 L 117 64 L 106 47 L 103 48 L 111 66"
          fill="#FAFAFA"
          stroke="#E4E4E7"
          strokeWidth="0.8"
        />
        <path d="M 92 85 L 87 150 L 95 150 L 100 104 L 101 85 Z" fill="#52525B" />
        <path d="M 101 85 L 100 104 L 104 150 L 112 150 L 109 85 Z" fill="#52525B" />
        <rect x="92" y="84" width="17" height="2.5" fill="#27272A" />
        <line x1="87" y1="146" x2="95" y2="146" stroke="#A1A1AA" strokeWidth="1" />
        <line x1="104" y1="146" x2="112" y2="146" stroke="#A1A1AA" strokeWidth="1" />
        <path
          d="M 76 112 C 72 104 75 94 84 92 C 92 90 99 95 100 103 C 101 109 97 114 93 118 C 90 121 89 124 89 128 L 83 128 C 83 122 85 118 88 114 C 91 111 93 108 93 104 C 92 99 88 97 84 98 C 80 99 78 104 81 109 Z"
          fill="#3F3F46"
        />
        <circle cx="101" cy="123" r="4" fill="#27272A" />
        <path d="M 87 150 L 80 158 L 94 158 L 94 150 Z" fill="#FAFAFA" />
        <path d="M 105 150 L 105 158 L 119 158 L 112 150 Z" fill="#FAFAFA" />
      </g>
    </svg>
  );
}
