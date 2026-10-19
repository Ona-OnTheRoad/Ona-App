"use client";

import { useEffect, useId, useState } from "react";
import { Share } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { usePwaInstall } from "@/lib/pwa/use-pwa-install";

/** Wait this long on a screen before nudging, so it never greets someone mid-task. */
const NUDGE_DELAY_MS = 8000;

/**
 * "Install Ona" banner above the dock. Android/Chrome: opens the browser's own
 * install dialog. iOS Safari (no install API): shows Share → Add to Home Screen steps.
 * It stays hidden inside the installed app, once Ona is known to be installed, and
 * while snoozed (see src/lib/pwa/install.ts for the rules).
 */
export function InstallNudge({ enabled }: { enabled: boolean }) {
  const t = useT();
  const { mode, promptInstall, dismiss } = usePwaInstall();
  const [ready, setReady] = useState(false);
  const [steps, setSteps] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!enabled || !mode) {
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setReady(true), NUDGE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [enabled, mode]);

  return (
    <>
      {enabled && mode && ready ? (
        <section
          aria-label={t("pwa.installTitle")}
          className="ona2 absolute inset-x-3 bottom-[calc(var(--rfd-height)+0.5rem)] z-[60] flex items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-3 text-ona-ink shadow-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-[10px]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold leading-tight">
              {t("pwa.installTitle")}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-ona-muted">
              {t("pwa.installBody")}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="ona"
                className="h-10 flex-1 px-3 text-[13px]"
                onClick={() =>
                  mode === "ios" ? setSteps(true) : void promptInstall()
                }
              >
                {mode === "ios" ? t("pwa.iosCta") : t("pwa.installCta")}
              </Button>
              <Button
                variant="onaOutline"
                className="h-10 px-3 text-[13px]"
                onClick={dismiss}
              >
                {t("pwa.notNow")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <BottomSheet
        open={steps}
        onClose={() => setSteps(false)}
        titleId={titleId}
        surface="ona"
        className="ona2 text-ona-ink"
        heightPercent={44}
        growToPercent={80}
      >
        <h2 id={titleId} className="text-[16px] font-bold">
          {t("pwa.iosTitle")}
        </h2>
        <ol className="mt-4 flex flex-col gap-3 pb-4">
          {(["pwa.iosStep1", "pwa.iosStep2", "pwa.iosStep3"] as const).map(
            (key, i) => (
              <li key={key} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ona-brand-soft text-[13px] font-bold text-ona-brand-ink"
                >
                  {i === 0 ? <Share className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="pt-0.5 text-[14px] leading-snug">
                  {t(key)}
                </span>
              </li>
            ),
          )}
        </ol>
        <Button
          size="ona"
          variant="ona"
          className="mb-2"
          onClick={() => setSteps(false)}
        >
          {t("pwa.gotIt")}
        </Button>
      </BottomSheet>
    </>
  );
}
