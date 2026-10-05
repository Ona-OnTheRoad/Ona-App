import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CustomerModeShell({
  stage,
  ink,
  muted,
  dashboardTitle,
  hasProAccount,
  switchAccount,
}: {
  stage: string;
  ink: string;
  muted: string;
  dashboardTitle: string;
  hasProAccount: boolean;
  switchAccount: ReturnType<typeof useApp>["switchAccount"];
}) {
  const [switchBusy, setSwitchBusy] = useState(false);
  const [switchErr, setSwitchErr] = useState<string | null>(null);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", stage)}>
      <PageHeader title={dashboardTitle} showBack={false} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <p className={cn("text-[15px] font-bold", ink)}>
          You are on Customer mode
        </p>
        <p className={cn("max-w-[280px] text-[12px] leading-relaxed", muted)}>
          {hasProAccount
            ? "Switch to Repair Pro to open this dashboard and Go Live."
            : "Create a Repair Pro account from the menu (Use as · Repair Pro) to use the professional dashboard."}
        </p>
        {hasProAccount ? (
          <>
            <button
              type="button"
              disabled={switchBusy}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-md bg-[#2c2c2e] px-5 text-[14px] font-semibold text-white disabled:opacity-50"
              onClick={() => {
                setSwitchErr(null);
                setSwitchBusy(true);
                void (async () => {
                  let result = await switchAccount("professional");
                  // One automatic retry for a cold-start session race the
                  // first tap right after navigation can fail while Supabase
                  // storage is still rehydrating; a manual re-tap succeeded.
                  if (
                    result !== null &&
                    result !== "needs_login" &&
                    result !== "needs_signup"
                  ) {
                    try {
                      const { ensureAppSession } =
                        await import("@/lib/supabase/session");
                      await ensureAppSession({
                        waitForSessionMs: 2200,
                        forceRefresh: true,
                      });
                    } catch {
                      /* retry anyway */
                    }
                    result = await switchAccount("professional");
                  }
                  if (result === "needs_signup") {
                    setSwitchErr(
                      "You don't have a Repair Pro account yet. Finish signup to go Live and receive jobs.",
                    );
                  } else if (
                    typeof result === "string" &&
                    result !== "needs_login"
                  ) {
                    setSwitchErr(result);
                  }
                  setSwitchBusy(false);
                })();
              }}
            >
              {switchBusy ? "Switching…" : "Use as Repair Pro"}
            </button>
            {switchErr ? (
              <p className="mt-2 max-w-[280px] text-[12px] font-medium text-[#FF6B35]">
                {switchErr}
              </p>
            ) : null}
          </>
        ) : (
          <Link
            href="/signup/pro?from=profile&next=/dashboard"
            className="mt-1 inline-flex h-11 items-center justify-center rounded-md bg-[#2c2c2e] px-5 text-[14px] font-semibold text-white"
          >
            Become a Repair Pro
          </Link>
        )}
        <Link
          href="/"
          className={cn("text-[12px] font-bold text-[#FF6B35]", "mt-1")}
        >
          Back to customer home
        </Link>
      </div>
    </div>
  );
}
