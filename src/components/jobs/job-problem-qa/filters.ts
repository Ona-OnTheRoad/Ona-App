import { cleanAddressLabel } from "@/lib/google-maps";
import { getLikelyProblem } from "@/lib/jobs/diagnosis";
import { parseJobProblem, type JobProblemRow } from "./parse";

/** When the card title already shows the vehicle (lower panel), drop both the
 * `Vehicle:` label row and the "Which vehicle?" question so the vehicle is
 * never repeated. */
export function filterHiddenVehicleRows(
  rows: JobProblemRow[],
  hideVehicleRow: boolean,
): JobProblemRow[] {
  if (!hideVehicleRow) return rows;
  return rows.filter(
    (r) => r.label !== "Vehicle" && !/which vehicle\??$/i.test(r.label.trim()),
  );
}

/** A bare coordinate string like "6.42810, 3.42190" reverse geocoding failed
 * and the app fell back to raw lat/lng. Never show that to a pro. */
export const COORDINATES_ONLY_RE = /^-?\d{1,2}(\.\d+)?,\s*-?\d{1,2}(\.\d+)?$/;

/** Location answers should be an address only drop the row when its only
 * content is raw latitude/longitude, and strip plus-codes from the rest. */
export function stripCoordinateLocations(
  rows: JobProblemRow[],
): JobProblemRow[] {
  return rows
    .map((r) => {
      if (!isLocationRow(r)) return r;
      return { ...r, answer: cleanAddressLabel(r.answer) };
    })
    .filter((r) => {
      if (!isLocationRow(r)) return true;
      return Boolean(r.answer) && !COORDINATES_ONLY_RE.test(r.answer);
    });
}

function isLocationRow(r: JobProblemRow): boolean {
  const label = r.label.toLowerCase();
  return label.includes("location") || label.includes("landmark");
}

export function customerWaitingHighlights(
  problem: string,
  locationLabel?: string | null,
  serviceType?: string | null,
): JobProblemRow[] {
  const rows: JobProblemRow[] = [];
  if (problem?.trim()) {
    // Shared source with Pro panel: parse raw Q/A first so both sides see the same base.
    const parsed = parseJobProblem(problem);
    const cleanedRows = stripCoordinateLocations(
      filterHiddenVehicleRows(parsed.rows, false),
    );
    const bestRawAnswer =
      parsed.summary ||
      cleanedRows.find((r) => r.answer && r.answer.trim())?.answer ||
      "";
    // Synthesis is trade-locked only (see diagnosis.ts) — pro's raw stays fallback.
    const diagnosis = getLikelyProblem({ serviceType, problem, locationLabel });
    // Use diagnosis only when it adds value beyond the raw answer; otherwise keep raw for accuracy.
    const likelyAnswer =
      diagnosis && diagnosis !== bestRawAnswer ? diagnosis : bestRawAnswer;
    if (likelyAnswer) {
      rows.push({ label: "likely Problem", answer: likelyAnswer.slice(0, 80) });
    }
  }
  if (locationLabel?.trim()) {
    const loc = cleanAddressLabel(String(locationLabel).trim());
    if (loc && !COORDINATES_ONLY_RE.test(loc)) {
      rows.push({ label: "Location", answer: loc });
    }
  }
  return rows.slice(0, 2);
}
