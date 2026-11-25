/**
 * Resolve once `check()` is true (polled), or after `timeoutMs` so a stuck navigation can never
 * keep a full-screen cover up forever. Returns whether the condition was met.
 */
export function waitUntil(
  check: () => boolean,
  {
    timeoutMs = 4000,
    intervalMs = 16,
  }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    if (check()) return resolve(true);
    const started = Date.now();
    const id = setInterval(() => {
      if (check()) {
        clearInterval(id);
        resolve(true);
      } else if (Date.now() - started >= timeoutMs) {
        clearInterval(id);
        resolve(false);
      }
    }, intervalMs);
  });
}

/** Resolve after the browser has painted twice (a committed route is actually on screen). */
export function afterPaint(): Promise<void> {
  if (typeof requestAnimationFrame === "undefined") return Promise.resolve();
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
