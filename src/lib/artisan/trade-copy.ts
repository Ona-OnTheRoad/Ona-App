import { ARTISAN_TRADE_CATALOG } from "@/lib/artisan/catalog/trades";
import type { ProService } from "@/lib/types";

/** Trades whose focus options are places (Homes, Offices…) rather than kinds of work. */
export function tradeFocusIsPlace(service: ProService | null | undefined) {
  if (!service) return true;
  const def = ARTISAN_TRADE_CATALOG.find((t) => t.service === service);
  return (def?.specialties ?? []).some((s) => /residential|office/i.test(s));
}

export function tradeFocusQuestion(service: ProService | null | undefined) {
  return tradeFocusIsPlace(service)
    ? "Where do you mainly work?"
    : "What do you specialise in?";
}

/** Public-profile heading for the multi-select of a pro's strongest work. */
export function coreFocusLabel(_service?: ProService | null) {
  return "My Specialties";
}

export function businessNameCopy(service: ProService | null | undefined) {
  if (service === "fashion") {
    return { label: "Business / Shop Name", placeholder: "e.g. Ade Stitches" };
  }
  return { label: "Workshop / Business Name", placeholder: "e.g. Ade Autos" };
}
