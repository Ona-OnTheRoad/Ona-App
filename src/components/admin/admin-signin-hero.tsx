import React from "react";
import Image from "next/image";

interface AdminSigninHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  priority?: boolean;
}

/**
 * AdminSigninHero
 *
 * Hero visual component for the Admin login page.
 * Displays the dark Ona Nigeria repair pro network map, evening skyline,
 * and Ona technician holding a phone.
 *
 * ViewBox / Aspect Ratio: 700 x 984 (aspect-[700/984])
 */
export function AdminSigninHero({
  className = "",
  priority = true,
  ...props
}: AdminSigninHeroProps) {
  return (
    <div
      className={`relative w-full h-full min-h-120 overflow-hidden rounded-3xl sm:rounded-[28px] lg:rounded-4xl select-none ${className}`}
      {...props}
    >
      <Image
        src="/images/admin-signin-hero.png"
        alt="Ona Control Centre - Repair Pro network across Nigeria"
        fill
        priority={priority}
        unoptimized
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}

/**
 * AdminSigninHeroSvg
 *
 * Vector / SVG variant of the hero component matching viewBox="0 0 700 984"
 */
export function AdminSigninHeroSvg({
  className = "",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 700 984"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={`w-full h-auto rounded-[28px] overflow-hidden ${className}`}
      {...props}
    >
      <defs>
        <clipPath id="admin-hero-clip">
          <rect width="700" height="984" rx="28" />
        </clipPath>
      </defs>
      <g clipPath="url(#admin-hero-clip)">
        <image
          href="/images/admin-signin-hero.png"
          width="700"
          height="984"
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    </svg>
  );
}

export default AdminSigninHero;

