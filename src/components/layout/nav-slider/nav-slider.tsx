"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppConfig } from "@/components/app-config-provider";
import { useT, type MessageKey } from "@/lib/i18n";
import { defaultBackHref, resetNavStack } from "@/lib/navigation";
import { applyNavOverrides } from "@/lib/nav-schema";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CLIENT_NAV, PRO_NAV, type MenuIconName } from "../app-menu/menu-nav";
import { useAccountSwitch } from "../app-menu/use-account-switch";
import { closeNavSlider, useNavSliderOpen } from "./nav-slider-store";
import { SliderHeader } from "./slider-header";
import {
  buildSliderItems,
  isHomeHref,
  isNavActive,
  type SliderNavRow,
} from "./slider-nav";

const SLIDE_MS = 220;

/** Mount while open and for the exit animation, so it can slide out. */
function useSlideMount(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const id = window.setTimeout(() => setMounted(false), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [open]);
  return { mounted, shown };
}

/**
 * Navigation slider: replaces the floating dock. Slides in from the left over a
 * dimmed page. Same rows, role split and backend overrides the dock had.
 */
export function NavSlider() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { config } = useAppConfig();
  const {
    accountType,
    proServices,
    isAuthenticated,
    switchingRole,
    setCategory,
    setSelectedTechId,
  } = useApp();
  const open = useNavSliderOpen();
  const { mounted, shown } = useSlideMount(open);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const isPro = accountType === "professional";
  const roleHome = defaultBackHref(accountType);
  const myShopHref =
    isPro && proServices.length === 1 ? `/shop/c/${proServices[0]}` : "/shop";

  const items = useMemo(() => {
    const base = (isPro ? PRO_NAV : CLIENT_NAV).map((i) =>
      i.href === "/shop" ? { ...i, href: myShopHref } : i,
    );
    const rows: SliderNavRow[] = base.some((i) => i.href === myShopHref)
      ? base
      : [
          ...base,
          {
            href: myShopHref,
            labelKey: "nav.myShop" as MessageKey,
            icon: "shop" as MenuIconName,
          },
        ];
    const nav = applyNavOverrides(
      rows,
      isPro
        ? config.content.proMenuOverrides
        : config.content.mainMenuOverrides,
      { role: isPro ? "pro" : "client", myShopHref },
    );
    return buildSliderItems(nav, t, myShopHref, roleHome);
  }, [config.content, isPro, myShopHref, roleHome, t]);

  const { warn, signupTarget, switching, onSwitch } = useAccountSwitch(
    open,
    closeNavSlider,
  );

  // Close on navigation, Escape, and when the session goes away.
  useEffect(() => {
    closeNavSlider();
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNavSlider();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    if (!isAuthenticated || switchingRole) closeNavSlider();
  }, [isAuthenticated, switchingRole]);

  // Move focus into the panel on open, and back to the opener on close.
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement;
      panelRef.current?.focus();
    } else if (returnFocus.current instanceof HTMLElement) {
      returnFocus.current.focus();
      returnFocus.current = null;
    }
  }, [open]);

  if (!mounted || !isAuthenticated) return null;

  const otherRole = isPro ? "motorist" : "professional";
  const switchLabel = isPro ? "Switch to Customer" : "Switch to Repair Pro";

  return (
    <div className="ona2 absolute inset-0 z-[100] overflow-hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("menu.closeMenu")}
        onClick={closeNavSlider}
        className={cn(
          "absolute inset-0 border-0 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none",
          shown ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-slider-title"
        className={cn(
          "absolute bottom-0 left-0 top-0 flex w-[70%] max-w-[420px] flex-col overflow-y-auto bg-ona-surface pb-6 shadow-xl outline-none transition-transform duration-200 ease-out motion-reduce:transition-none",
          shown ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SliderHeader />

        <nav aria-label={t("nav.main")} className="mt-4 px-4">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {items.map(({ key, href, label, Icon }) => {
              const active = isNavActive(href, pathname, roleHome, myShopHref);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => {
                      closeNavSlider();
                      // Home always opens on a blank trade selector, never a stale flow.
                      if (isHomeHref(href, roleHome)) {
                        e.preventDefault();
                        setCategory("none");
                        setSelectedTechId(null);
                        resetNavStack(href);
                        router.replace(href);
                      }
                    }}
                    className={cn(
                      "flex h-12 items-center gap-4 rounded-ona-card px-4 text-[17px] font-semibold no-underline transition-colors",
                      active
                        ? "bg-ona-brand-soft text-ona-brand-ink"
                        : "text-ona-ink hover:bg-ona-field",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] shrink-0",
                        active ? "text-ona-brand-ink" : "text-slate-600",
                      )}
                      strokeWidth={1.8}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-12 px-4">
          <button
            type="button"
            disabled={switching}
            onClick={() => void onSwitch(otherRole)}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-ona-card border-0 bg-ona-brand text-[17px] font-semibold text-white transition-colors active:bg-ona-brand-press disabled:opacity-70"
          >
            {switching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span className="sr-only">Switching</span>
              </>
            ) : (
              switchLabel
            )}
          </button>
          {warn ? (
            <div
              role="alert"
              className="mt-2 rounded-ona-ctl bg-ona-field px-3 py-2 text-[12px] font-medium leading-snug text-ona-ink"
            >
              <p>{warn}</p>
              {signupTarget ? (
                <button
                  type="button"
                  className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-ona-brand-ink underline"
                  onClick={() => {
                    closeNavSlider();
                    router.push(
                      signupTarget === "professional"
                        ? "/signup/pro?from=menu&attach=1&next=/dashboard"
                        : "/signup/motorist?from=menu&attach=1&next=/",
                    );
                  }}
                >
                  {t("menu.signUpHere")}
                </button>
              ) : null}
              {warn === t("menu.needLogin") ? (
                <button
                  type="button"
                  className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-ona-brand-ink underline"
                  onClick={() => {
                    closeNavSlider();
                    router.push("/login/signin");
                  }}
                >
                  {t("menu.logIn")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
