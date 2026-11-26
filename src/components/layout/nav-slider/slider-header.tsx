"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { isProService } from "@/lib/pro-service-id";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { firstAndLastName, TRADE_LABEL_KEY } from "../app-menu/menu-nav";

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
        className="h-16 w-16 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ona-brand-soft text-[24px] font-bold text-ona-brand-ink"
    >
      {(name.trim()[0] || "O").toUpperCase()}
    </span>
  );
}

/** Avatar, greeting and name; Service Pros also get their trade and online status. */
export function SliderHeader() {
  const t = useT();
  const { accountType, userProfile, displayName, proServices, proLive } =
    useApp();
  const isPro = accountType === "professional";
  const name = firstAndLastName(userProfile?.fullName || displayName || "");

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("menu.goodMorning")
      : hour < 17
        ? t("menu.goodAfternoon")
        : t("menu.goodEvening");

  const first = proServices[0];
  const trade = first
    ? isProService(first)
      ? t(TRADE_LABEL_KEY[first])
      : first
    : null;

  return (
    <div className="flex items-start gap-3 px-4 pt-4">
      <Avatar src={userProfile?.avatarUrl} name={name} />
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[13px] leading-tight text-ona-muted">{greeting}</p>
        <p
          id="nav-slider-title"
          className="truncate text-[18px] font-bold leading-tight text-ona-ink"
        >
          {name}
        </p>
        {isPro && trade ? (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="truncate rounded-full border border-ona-border bg-ona-surface px-3 py-1 text-[13px] font-medium text-ona-ink">
              {trade}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold",
                proLive
                  ? "border-ona-success/30 bg-ona-success-soft text-ona-success"
                  : "border-ona-danger/25 bg-ona-danger/10 text-ona-danger",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 rounded-full",
                  proLive ? "bg-ona-success" : "bg-ona-danger",
                )}
              />
              {proLive ? "Online" : "Offline"}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
