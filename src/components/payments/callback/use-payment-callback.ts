"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isBookedOrActiveStatus } from "../shared/job-status";
import { breakOutOfIframe, navigateTopOr } from "../shared/top-frame";

export type CallbackStatus = "loading" | "ok" | "fail";

export function usePaymentCallback() {
  const router = useRouter();
  const params = useSearchParams();

  // Flutterwave returns tx_ref / status; we also pass ref= on redirect_url
  const ref =
    params.get("ref") ||
    params.get("tx_ref") ||
    params.get("txRef") ||
    params.get("reference") ||
    params.get("trxref") ||
    "";
  const transactionId =
    params.get("transaction_id") ||
    params.get("transactionId") ||
    params.get("id") ||
    "";
  const jobId = params.get("jobId") || "";
  const flwStatus = (params.get("status") || "").toLowerCase();

  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Verifying payment…");
  const [bookedJobId, setBookedJobId] = useState<string | null>(jobId || null);

  // In-app pay: promote callback from iframe → Ona phone shell
  useEffect(() => {
    breakOutOfIframe();
  }, []);

  useEffect(() => {
    // Still inside iframe? escape first so verify UI paints in the shell
    if (breakOutOfIframe()) return;

    const goCheckout = (jid: string) => {
      const dest = `/payments/checkout?jobId=${encodeURIComponent(jid)}`;
      navigateTopOr(dest, () => router.replace(dest));
    };
    const goJob = (jid: string) => {
      const dest = `/jobs/${jid}`;
      navigateTopOr(dest, () => router.replace(dest));
    };

    // Closed Flutterwave without paying → reset 20‑min timer (not an attempt)
    if (flwStatus === "cancelled" || flwStatus === "failed") {
      setStatus("fail");
      setMessage(
        "Payment cancelled. Timer reset. Pay again for a fresh 20 minutes.",
      );
      if (jobId) {
        void (async () => {
          try {
            // Best-effort: clear open session so next Pay starts a new window
            const { authFetch } = await import("@/lib/api-auth-headers");
            await authFetch(`/api/jobs/${encodeURIComponent(jobId)}/pay`, {
              method: "POST",
              body: JSON.stringify({
                action: "cancel",
              }),
            });
          } catch {
            /* ignore checkout still works */
          }
          window.setTimeout(() => goCheckout(jobId), 700);
        })();
      }
      return;
    }
    if (!ref && !jobId && !transactionId) {
      setStatus("fail");
      setMessage("Missing payment reference.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { authFetch } = await import("@/lib/api-auth-headers");
        const res = await authFetch("/api/payments/verify", {
          method: "POST",
          body: JSON.stringify({
            reference: ref || undefined,
            transactionId: transactionId || undefined,
            jobId: jobId || undefined,
          }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (jobId) {
          await authFetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
            cache: "no-store",
          }).catch(() => null);
        }
        if (json?.ok) {
          setStatus("ok");
          const jid =
            json.data?.job?.id ||
            jobId ||
            json.data?.payment?.requestId ||
            null;
          setBookedJobId(jid);
          setMessage("Payment held in escrow. Job is Booked.");
          if (jid) {
            window.setTimeout(() => goJob(jid), 600);
          }
        } else if (jobId) {
          const jr = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
            cache: "no-store",
          });
          const jj = await jr.json().catch(() => null);
          const st = jj?.data?.job?.status;
          if (isBookedOrActiveStatus(st)) {
            setStatus("ok");
            setBookedJobId(jobId);
            setMessage("Payment received. Job is Booked.");
            goJob(jobId);
            return;
          }
          // Unpaid / verify failed → always return to checkout shell
          setStatus("fail");
          setMessage(
            json?.error?.message ||
              "Payment not confirmed yet. You can Pay again from checkout.",
          );
          window.setTimeout(() => goCheckout(jobId), 900);
        } else {
          setStatus("fail");
          setMessage(json?.error?.message || "Verification failed.");
        }
      } catch {
        if (!cancelled) {
          setStatus("fail");
          setMessage("Could not verify payment.");
          if (jobId) {
            window.setTimeout(() => goCheckout(jobId), 900);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref, transactionId, flwStatus, jobId, router]);

  return { ref, jobId, status, message, bookedJobId };
}
