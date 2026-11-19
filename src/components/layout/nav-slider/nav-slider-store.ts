import { useSyncExternalStore } from "react";

/**
 * Open/closed state of the navigation slider. A tiny external store so any
 * header can open it without a provider or prop drilling.
 */
let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((l) => l());
}

export const openNavSlider = () => set(true);
export const closeNavSlider = () => set(false);

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useNavSliderOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
