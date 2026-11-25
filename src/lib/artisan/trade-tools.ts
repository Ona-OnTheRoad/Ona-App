import type { ProService } from "@/lib/types";

/** Quick-add tool suggestions per trade (shown on the verification Tools field). */
export const TRADE_TOOL_SUGGESTIONS: Record<ProService, string[]> = {
  mechanic: [
    "Toolbox / hand tools",
    "Jack & stands",
    "OBD scanner",
    "Torque wrench",
  ],
  vulcanizer: [
    "Tyre levers",
    "Compressor",
    "Wheel balancer",
    "Puncture repair kit",
  ],
  towing: ["Tow truck", "Tow straps", "Wheel dollies", "Winch"],
  battery: ["Battery tester", "Jump starter", "Multimeter", "Battery charger"],
  ac: ["Gauge manifold", "Vacuum pump", "Leak detector", "Multimeter"],
  body: ["Spray gun", "Dent puller", "Sander", "Welding machine"],
  electrical: ["Multimeter", "Wire stripper", "Cable tester", "Drill"],
  diagnostics: ["OBD scanner", "Multimeter", "Oscilloscope", "Laptop"],
  fashion: ["Sewing machine", "Overlocker", "Measuring tape", "Mannequin"],
  plumber: ["Pipe wrench set", "Pipe cutter", "Drain snake", "Blow torch"],
  carpenter: ["Hand saw", "Power drill", "Chisel set", "Measuring tape"],
  painter: ["Paint rollers", "Spray gun", "Ladder", "Scraper set"],
  solar: ["Multimeter", "Solar panel tester", "Ladder", "Cable crimper"],
  generator: [
    "Toolbox / hand tools",
    "Multimeter",
    "Compressor",
    "Spark plug set",
  ],
};

export function toolSuggestionsFor(
  service: ProService | string | null | undefined,
): string[] {
  return TRADE_TOOL_SUGGESTIONS[service as ProService] ?? [];
}
