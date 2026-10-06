import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import type { useRouter } from "next/navigation";
import type { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  isLight: boolean;
  busy: boolean;
  router: ReturnType<typeof useRouter>;
  setCategory: ReturnType<typeof useApp>["setCategory"];
  setPayCancelOpen: (v: boolean) => void;
  cancelRequestInstant: (actor: "motorist") => void;
}

/** Pay screen: single Cancel → choose payment vs request (portal in phone). */
export function PayCancelDialog({
  isLight,
  busy,
  router,
  setCategory,
  setPayCancelOpen,
  cancelRequestInstant,
}: Props): ReactElement {
  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 p-3">
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-2xl shadow-2xl",
          isLight ? "bg-white" : "bg-[#1c1c1e]",
        )}
        role="dialog"
        aria-label="Cancel options"
      >
        <div className="px-4 pb-2 pt-4">
          <p
            className={cn(
              "text-center text-[15px] font-black",
              isLight ? "text-slate-900" : "text-white",
            )}
          >
            Cancel
          </p>
          <p
            className={cn(
              "mt-1 text-center text-[12px] font-medium",
              isLight ? "text-slate-500" : "text-white/55",
            )}
          >
            Choose what you want to cancel
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPayCancelOpen(false);
            setCategory("none");
            router.replace("/");
          }}
          className={cn(
            "flex h-12 w-full items-center justify-center border-0 text-[14px] font-bold",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          Cancel payment
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setPayCancelOpen(false);
            cancelRequestInstant("motorist");
          }}
          className={cn(
            "flex h-12 w-full items-center justify-center border-0 text-[14px] font-bold text-red-500",
          )}
        >
          Cancel request
        </button>
        <button
          type="button"
          onClick={() => setPayCancelOpen(false)}
          className={cn(
            "flex h-11 w-full items-center justify-center border-0 text-[13px] font-semibold",
            isLight ? "text-slate-500" : "text-white/50",
          )}
        >
          Keep paying
        </button>
      </div>
    </div>,
    document.getElementById("ona-phone") || document.body,
  );
}
