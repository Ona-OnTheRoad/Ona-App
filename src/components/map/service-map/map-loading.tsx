import { useApp } from "@/lib/store";
import { mapThemeForApp } from "./map-theme-ns";

/** Themed map loading placeholder matches dashboard light/dark map colors */
export function MapLoading() {
  const { theme } = useApp();
  const { backgroundColor } = mapThemeForApp(theme === "light");
  return (
    <div
      className="flex h-full w-full items-center justify-center text-sm text-[#a8c9b5]"
      style={{ backgroundColor }}
    >
      Loading live map…
    </div>
  );
}
