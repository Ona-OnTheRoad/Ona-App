import { useApp } from "@/lib/store";
import { mapThemeForApp } from "./map-theme-ns";

/** Shown in the map slot until the user answers the location prompt. */
export function LocationGatePrompt({
  onAllow,
  onSkip,
}: {
  onAllow: () => void;
  onSkip: () => void;
}) {
  const { theme } = useApp();
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-ona-ink"
      style={{ backgroundColor: mapThemeForApp(theme === "light").backgroundColor }}
    >
      <p className="max-w-[16rem]">
        Allow location so we can open the map on you and find pros nearby.
      </p>
      <button
        type="button"
        onClick={onAllow}
        className="rounded-full border-0 bg-ona-brand-ink px-4 py-2 text-xs font-semibold text-white"
      >
        Allow location
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="border-0 bg-transparent text-xs underline opacity-80"
      >
        Not now
      </button>
    </div>
  );
}
