"use client";

import { Menu } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { openNavSlider, useNavSliderOpen } from "./nav-slider-store";

/**
 * Opens the navigation slider.
 *  - "brand": coral circle (Home, over the map)
 *  - "plain": compact icon for page headers
 */
export function NavMenuButton({
  variant = "plain",
  className,
}: {
  variant?: "brand" | "plain";
  className?: string;
}) {
  const t = useT();
  const expanded = useNavSliderOpen();
  return (
    <button
      type="button"
      onClick={openNavSlider}
      aria-label={t("home.openMenu")}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className={cn(
        "ona2 flex shrink-0 cursor-pointer items-center justify-center border-0 p-0 transition-transform active:scale-95",
        variant === "brand"
          ? "h-11 w-11 rounded-full bg-ona-brand text-white shadow-md"
          : "h-8 w-8 rounded-full bg-transparent text-ona-brand-ink",
        className,
      )}
    >
      <Menu
        className={variant === "brand" ? "h-5 w-5" : "h-5 w-5"}
        strokeWidth={2.2}
        aria-hidden
      />
    </button>
  );
}
