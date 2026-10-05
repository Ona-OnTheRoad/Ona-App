import { useState } from "react";
import type { PickedLocation } from "@/components/map/location-picker-map";
import { detectExpressTrade } from "@/lib/express/question-engine";
import { useApp } from "@/lib/store";
import type { Quote, Stage } from "./types";

type Args = {
  answers: Record<string, string>;
  setStage: (s: Stage) => void;
  setError: (e: string | null) => void;
  setBusy: (b: boolean) => void;
};

async function postQuote(body: Record<string, unknown>): Promise<Quote> {
  const res = await fetch("/api/express/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json?.data) throw new Error(json?.error?.message);
  return json.data as Quote;
}

/** Location pick, server price quote and urgency selection. */
export function useExpressQuote({
  answers,
  setStage,
  setError,
  setBusy,
}: Args) {
  const { location } = useApp();
  const [urgency, setUrgency] = useState<string>("normal");
  const [pickedLoc, setPickedLoc] = useState<PickedLocation | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const coordsOrDevice = () =>
    pickedLoc ?? {
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
    };

  const goLocation = () => {
    setError(null);
    setStage("location");
  };

  const confirmLocation = async () => {
    setError(null);
    const coords = coordsOrDevice();
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
      setError("Confirm your location first.");
      return;
    }
    const trade = detectExpressTrade(answers);
    setBusy(true);
    try {
      setQuote(await postQuote({ trade, lat: coords.lat, lng: coords.lng }));
      setStage("urgency");
    } catch {
      setError("Could not price this booking. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const pickUrgency = async (kind: string) => {
    if (!quote) return;
    setError(null);
    const coords = coordsOrDevice();
    try {
      const next = await postQuote({
        trade: quote.trade,
        lat: coords.lat,
        lng: coords.lng,
        urgency: kind,
      });
      setUrgency(kind);
      setQuote(next);
      setStage("pay");
    } catch {
      setError("Could not apply urgency. Try again.");
    }
  };

  return {
    urgency,
    pickedLoc,
    setPickedLoc,
    quote,
    setQuote,
    goLocation,
    confirmLocation,
    pickUrgency,
  };
}
