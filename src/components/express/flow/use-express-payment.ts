import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PickedLocation } from "@/components/map/location-picker-map";
import { isExpressTrade } from "@/lib/express/pricing";
import { useApp } from "@/lib/store";
import { toastSuccess } from "@/lib/toast";
import type { AssignedPro, BankPay, BookingType, Quote, Stage } from "./types";

type Args = {
  stage: Stage;
  setStage: (s: Stage) => void;
  setError: (e: string | null) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  quote: Quote | null;
  pickedLoc: PickedLocation | null;
  urgency: string;
  answers: Record<string, string>;
  vehicleLabel: string;
  bookingType: BookingType;
  scheduleIso: string | null;
  detectedTrade: string | null;
};

/** Booking creation, virtual-account payment, verify polling, cancel. */
export function useExpressPayment(a: Args) {
  const router = useRouter();
  const { userProfile, backendUserId, isAuthenticated, location } = useApp();
  const { stage, setStage, setError, busy, setBusy, quote, pickedLoc } = a;

  const [requestId, setRequestId] = useState<string | null>(null);
  const [bankPay, setBankPay] = useState<BankPay | null>(null);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [assignedPro, setAssignedPro] = useState<AssignedPro | null>(null);

  /** Entering the pay stage: create booking, open VA, start polling. */
  const beginPay = async () => {
    if (!isAuthenticated || !backendUserId) {
      router.push("/login/role");
      return;
    }
    if (!quote) return;
    setError(null);
    setBusy(true);
    try {
      const coords = pickedLoc ?? {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
      };
      const email =
        userProfile?.email || `express_${backendUserId.slice(0, 8)}@ona.africa`;

      // 1) Create the express booking (idempotent per pay attempt)
      let reqId = requestId;
      if (!reqId) {
        const res = await fetch("/api/express/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trade: quote.trade,
            answers: a.answers,
            vehicleLabel: a.vehicleLabel || null,
            lat: coords.lat,
            lng: coords.lng,
            locationLabel: pickedLoc?.label || location.label || "Near you",
            bookingType: a.bookingType,
            urgency: a.urgency,
            scheduledAt: a.bookingType === "scheduled" ? a.scheduleIso : null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.data?.requestId) {
          throw new Error(json?.error?.message || "Could not create booking");
        }
        reqId = json.data.requestId as string;
        setRequestId(reqId);
      }

      // 2) Open the Flutterwave VA on the same rails as job checkout
      const initRes = await fetch("/api/express/pay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: reqId,
          urgency: a.urgency,
          email,
          customerName: userProfile?.fullName || null,
        }),
      });
      const initJson = await initRes.json();
      if (!initRes.ok || !initJson?.data?.bankTransfer) {
        throw new Error(initJson?.error?.message || "Could not open payment");
      }
      const bt = initJson.data.bankTransfer;
      setBankPay({
        accountName: bt.accountName ?? "Ona",
        accountNumber: bt.accountNumber ?? "",
        bankName: bt.bankName ?? "",
        amountMajor: initJson.data.amountMajor ?? quote.totalMajor,
        reference: initJson.data.reference,
        sessionEndsAt: initJson.data.sessionEndsAt,
      });
      setBusy(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment.");
      setBusy(false);
    }
  };

  useEffect(() => {
    if (stage === "pay" && quote && !bankPay && !busy) {
      void beginPay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const { detectedTrade } = a;
  /** Poll verify while bank details are on screen; success → assignment. */
  useEffect(() => {
    if (stage !== "pay" || !bankPay) return;
    let stopped = false;
    const tick = window.setInterval(() => {
      void (async () => {
        try {
          const res = await fetch("/api/express/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: bankPay.reference }),
          });
          const json = await res.json();
          if (!stopped && res.ok && json?.data?.expired) {
            // 20-min window elapsed: drop the dead VA and open a fresh one.
            stopped = true;
            window.clearInterval(tick);
            setBankPay(null);
            return;
          }
          if (!stopped && res.ok && json?.data?.success) {
            stopped = true;
            window.clearInterval(tick);
            setAssignedPro({
              name: json.data.assignedProName ?? "",
              trade:
                json.data.trade && isExpressTrade(json.data.trade)
                  ? json.data.trade
                  : (detectedTrade ?? "mechanic"),
              requestId: requestId ?? "",
            });
            setStage("assigned");
          }
        } catch {
          /* keep polling */
        }
      })();
    }, 3000);
    return () => {
      stopped = true;
      window.clearInterval(tick);
    };
  }, [stage, bankPay, requestId, detectedTrade]);

  /** Cancel payment only, or payment together with the draft request. */
  const cancelPay = async (mode: "payment" | "both") => {
    if (!requestId) return;
    setCancelBusy(true);
    setError(null);
    try {
      await fetch("/api/requests/open-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, mode }),
      });
      router.back();
    } catch {
      setError("Could not cancel. Try again.");
      setCancelBusy(false);
    }
  };

  /** Copy the account number and confirm with a toast. */
  const copyAccountNumber = (accountNumber: string) => {
    void navigator.clipboard.writeText(accountNumber).catch(() => undefined);
    toastSuccess("Copied");
  };

  return {
    setRequestId,
    bankPay,
    cancelAsk,
    setCancelAsk,
    cancelBusy,
    assignedPro,
    setAssignedPro,
    cancelPay,
    copyAccountNumber,
  };
}
