"use client";

import { useEffect, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  clearPageExitClass,
  navigateBack,
  resolveBackHref,
} from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Secondary page chrome: optional back + title. Navigation is the bottom dock. */
export function PageHeader({
  title,
  subtitle,
  backHref,
  showBack = true,
  titleClassName,
  titleStyle,
  className,
  style,
  onBack,
}: {
  title: string;
  subtitle?: string;
  /**
   * Optional override for hierarchical parent.
   * Default = smart parent of this route (never browser history).
   */
  backHref?: string;
  /** Hide back control (e.g. Professional Dashboard home) */
  showBack?: boolean;
  /** Optional title color/class (e.g. brand orange for Dashboard) */
  titleClassName?: string;
  titleStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  /** Full override: step backwards through an in-page flow instead of routing. */
  onBack?: () => void;
}) {
  const { theme, accountType } = useApp();
  const isLight = theme === "light";
  const router = useRouter();
  const pathname = usePathname() || "/";

  const parentHref = resolveBackHref(pathname, accountType, backHref);

  useEffect(() => {
    // Never leave shell dimmed/shifted if a prior back animation was interrupted
    clearPageExitClass();
  }, []);

  const handleBack = () => {
    clearPageExitClass();
    if (onBack) {
      onBack();
      return;
    }
    navigateBack(router, parentHref, accountType);
  };

  return (
    <header
      className={cn(
        "flex items-center gap-2 px-3 py-2.5",
        isLight ? "bg-white" : "bg-black",
        className,
      )}
      style={style ?? { backgroundColor: isLight ? "#FFFFFF" : "#000000" }}
    >
      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center border-0 transition-transform duration-150 active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft
            className="h-4 w-4"
            style={{
              color: isLight ? "#1f2937" : "#ffffff",
            }}
          />
        </button>
      ) : (
        <span className="w-1" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "truncate text-base font-bold",
            titleClassName || (isLight ? "text-slate-900" : "text-white"),
          )}
          style={titleStyle}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "truncate text-[11px]",
              isLight ? "text-slate-500" : "text-[#a1a1a6]",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
