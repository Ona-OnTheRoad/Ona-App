export const ALERTED_KEY = "om-release-pay-alerted";
const MINIMIZED_KEY = "om-release-pay-minimized";
const LAST_BUZZ_KEY = "om-release-pay-last-buzz";
/** Jobs that must never show the release UI again this browser */
const DONE_KEY = "om-release-pay-done";

export function readSet(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function writeSet(key: string, s: Set<string>) {
  try {
    sessionStorage.setItem(key, JSON.stringify([...s].slice(-80)));
  } catch {
    /* */
  }
}

export function markDone(id: string) {
  const s = readSet(DONE_KEY);
  s.add(id);
  writeSet(DONE_KEY, s);
}

export function isDone(id: string): boolean {
  return readSet(DONE_KEY).has(id);
}

export function markAlerted(id: string) {
  const s = readSet(ALERTED_KEY);
  s.add(id);
  writeSet(ALERTED_KEY, s);
}

export function isMinimized(id: string): boolean {
  return readSet(MINIMIZED_KEY).has(id);
}

export function setMinimized(id: string, on: boolean) {
  const s = readSet(MINIMIZED_KEY);
  if (on) s.add(id);
  else s.delete(id);
  writeSet(MINIMIZED_KEY, s);
}

export function readLastBuzz(id: string): number {
  try {
    const raw = sessionStorage.getItem(LAST_BUZZ_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, number>;
    return Number(map[id]) || 0;
  } catch {
    return 0;
  }
}

export function writeLastBuzz(id: string, ts: number) {
  try {
    const raw = sessionStorage.getItem(LAST_BUZZ_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    map[id] = ts;
    sessionStorage.setItem(LAST_BUZZ_KEY, JSON.stringify(map));
  } catch {
    /* */
  }
}
