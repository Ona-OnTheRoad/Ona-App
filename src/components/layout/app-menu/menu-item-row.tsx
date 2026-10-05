import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SolidMenuIcon } from "./solid-menu-icon";
import type { MenuIconName } from "./menu-nav";

/** Menu row labels: pure black (light) / white (dark) */
export function rowIdleClass(isLight: boolean) {
  return isLight ? "text-black" : "text-white";
}

export function rowActiveClass(isLight: boolean) {
  return isLight ? "rounded-lg bg-[#FF6B35]/10 text-black" : "text-[#FF6B35]";
}

/** Solid orange DIV icons (Dashboard energy) no SVG outline possible. */
export function MenuIcon({
  name,
  isLight,
}: {
  name: MenuIconName;
  isLight: boolean;
}) {
  return (
    <span className="om-menu-icon-slot inline-flex shrink-0" aria-hidden>
      <SolidMenuIcon name={name} isLight={isLight} />
    </span>
  );
}

/** Tappable drawer row: icon + label (+ optional trailing badge). */
export function MenuItemRow({
  isLight,
  active,
  icon,
  labelClassName,
  onClick,
  dataMenuItem,
  children,
  trailing,
}: {
  isLight: boolean;
  active?: boolean;
  icon: MenuIconName;
  labelClassName: string;
  onClick: () => void;
  dataMenuItem?: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      data-menu-item={dataMenuItem}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 border-0 bg-transparent px-3 py-2.5 text-left text-[16px] font-medium tracking-[-0.01em] transition-colors",
        active ? rowActiveClass(isLight) : rowIdleClass(isLight),
      )}
    >
      <MenuIcon name={icon} isLight={isLight} />
      <span className={labelClassName}>{children}</span>
      {trailing}
    </button>
  );
}
