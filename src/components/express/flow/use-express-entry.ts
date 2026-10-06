import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { PickedLocation } from "@/components/map/location-picker-map";
import { isExpressTrade } from "@/lib/express/pricing";
import type { AssignedPro, Quote, ResumePayload, Stage } from "./types";

type Args = {
  stage: Stage;
  setStage: Dispatch<SetStateAction<Stage>>;
  setError: (e: string | null) => void;
  setRequestId: (id: string | null) => void;
  setPickedLoc: (p: PickedLocation | null) => void;
  setQuote: (q: Quote | null) => void;
  setAssignedPro: (p: AssignedPro | null) => void;
};

/**
 * Entry resolution: payment-gateway return (?ref=&request=) → verify →
 * assignment, "Finish payment" resume, and the one-open-request gate.
 */
export function useExpressEntry({
  stage,
  setStage,
  setError,
  setRequestId,
  setPickedLoc,
  setQuote,
  setAssignedPro,
}: Args) {
  const verifyTriesRef = useRef(0);

  /** Jump straight into the payment step of an existing Express draft. */
  async function resumeExpressPayment(r: ResumePayload) {
    setRequestId(r.requestId);
    setPickedLoc({
      lat: r.lat,
      lng: r.lng,
      label: r.label,
      city: "",
      area: "",
    });
    try {
      const res = await fetch("/api/express/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: r.trade, lat: r.lat, lng: r.lng }),
      });
      const json = await res.json();
      if (res.ok && json?.data) {
        setQuote(json.data as Quote);
        setStage("pay");
      } else {
        setError("Could not resume this booking. Try again.");
      }
    } catch {
      setError("Could not resume this booking. Try again.");
    }
  }

  /** Return from payment gateway (?paid=1&ref=…) → verify → assignment. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ref") && params.get("request")) {
      setStage("paying");
      return;
    }
    // "Finish payment" resume (explicit card tap).
    if (params.get("resume")) {
      try {
        const raw = window.sessionStorage.getItem("ona-express-resume");
        if (raw) {
          window.sessionStorage.removeItem("ona-express-resume");
          const r = JSON.parse(raw) as ResumePayload;
          if (r?.requestId) {
            void resumeExpressPayment(r);
            return;
          }
        }
      } catch {
        /* fall through to gate */
      }
    }
    // App-wide one-open-request rule: jump into the live request or block.
    void (async () => {
      try {
        const res = await fetch("/api/requests/open-state");
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!d) return;
        if (d.expressPending) {
          void resumeExpressPayment({
            requestId: d.expressPending.requestId,
            trade: d.expressPending.trade,
            lat: Number(d.expressPending.lat),
            lng: Number(d.expressPending.lng),
            label: String(d.expressPending.locationLabel || "Near you"),
          });
          return;
        }
        if (d.hasOpen) setStage("blocked");
      } catch {
        /* offline: allow normal entry */
      }
    })();
  }, []);

  useEffect(() => {
    if (stage !== "paying") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const requestId = params.get("request");
    const tradeParam = params.get("trade");
    if (!ref || !requestId) return;
    if (verifyTriesRef.current >= 4) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/express/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref }),
        });
        const json = await res.json();
        if (!res.ok || !json?.data?.success) throw new Error("not paid yet");
        if (!cancelled) {
          setAssignedPro({
            name: json.data.assignedProName ?? "",
            trade:
              (tradeParam && isExpressTrade(tradeParam) ? tradeParam : null) ??
              "mechanic",
            requestId,
          });
          setStage("assigned");
        }
      } catch {
        verifyTriesRef.current += 1;
        window.setTimeout(() => {
          if (!cancelled) setStage((s) => (s === "paying" ? "paying" : s));
        }, 2500);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage]);
}
