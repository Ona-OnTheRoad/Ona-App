"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigateTopOr } from "../shared/top-frame";
import type { CallbackStatus } from "./use-payment-callback";

export function CallbackView({
  isLight,
  status,
  message,
  reference,
  jobId,
  bookedJobId,
}: {
  isLight: boolean;
  status: CallbackStatus;
  message: string;
  reference: string;
  jobId: string;
  bookedJobId: string | null;
}) {
  const router = useRouter();
  const sheet = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const ink = isLight ? "text-slate-900" : "text-white";

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-3 px-6 text-center",
        sheet,
      )}
    >
      {status === "loading" && (
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      )}
      {status === "ok" && (
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      )}
      {status === "fail" && <XCircle className="h-12 w-12 text-red-500" />}
      <p className={cn("text-[15px] font-bold", ink)}>{message}</p>
      {reference ? (
        <p className="text-[11px] text-brand">Ref · {reference}</p>
      ) : null}
      {status === "ok" && bookedJobId ? (
        <button
          type="button"
          onClick={() => {
            const dest = `/jobs/${bookedJobId}`;
            navigateTopOr(dest, () => router.replace(dest));
          }}
          className="mt-2 rounded-xl border-0 bg-[#FF6B35] px-4 py-2.5 text-[13px] font-bold text-white"
        >
          Open booked job
        </button>
      ) : null}
      {status === "fail" && jobId ? (
        <button
          type="button"
          onClick={() => {
            const dest = `/payments/checkout?jobId=${encodeURIComponent(jobId)}`;
            navigateTopOr(dest, () => router.replace(dest));
          }}
          className="mt-2 rounded-xl border-0 bg-[#FF6B35] px-4 py-2.5 text-[13px] font-bold text-white"
        >
          Back to checkout
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          const dest = jobId
            ? `/payments/checkout?jobId=${encodeURIComponent(jobId)}`
            : "/requests";
          navigateTopOr(dest, () => router.push(dest));
        }}
        className="mt-2 rounded-xl border-0 bg-[#323231] px-4 py-2.5 text-[13px] font-bold text-white"
      >
        {jobId ? "Pay again" : "View requests"}
      </button>
      <button
        type="button"
        onClick={() =>
          navigateTopOr("/payments/history", () =>
            router.push("/payments/history"),
          )
        }
        className="text-[12px] font-bold text-brand"
      >
        Payment history
      </button>
    </div>
  );
}
