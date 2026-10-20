/** Single-flight lanes. Only pending work is retained; no settled snapshot cache. */
export function createSnapshotReads() {
  type Readers = Map<() => boolean, () => Promise<unknown>>;
  type Pending = { readers: Readers; resolve: (v: unknown) => void;
    reject: (e: unknown) => void; promise: Promise<unknown> };
  type Flight = { promise: Promise<unknown>; readers: Readers; pending?: Pending };
  const flights = new Map<string, Flight>();
  const always = () => true;
  let active = true;
  function start(key: string, readers: Readers): Promise<unknown> {
    const flight: Flight = { readers, promise: Promise.resolve().then(() => {
      if (active) for (const [isCurrent, read] of readers) {
        if (isCurrent()) return read();
      }
      throw new Error("Snapshot scope ended");
    }) };
    flights.set(key, flight);
    const finish = () => {
      if (flights.get(key) !== flight) return;
      flights.delete(key);
      if (flight.pending) {
        const next = flight.pending;
        if (active) void start(key, next.readers).then(next.resolve, next.reject);
        else next.reject(new Error("Snapshot scope ended"));
      }
    };
    // Register cleanup before consumers, and handle both outcomes without an
    // ignored rejecting `finally` promise.
    void flight.promise.then(finish, finish);
    return flight.promise;
  }
  return {
    read<T>(key: string, read: () => Promise<T>, invalidate = false, onCoalesced?: () => void,
      isCurrent: () => boolean = always): Promise<T> {
      if (!active) return Promise.reject(new Error("Snapshot scope ended"));
      const flight = flights.get(key);
      if (!flight) return start(key, new Map([[isCurrent, read]])) as Promise<T>;
      onCoalesced?.();
      if (!invalidate) {
        flight.readers.set(isCurrent, read);
        return flight.promise as Promise<T>;
      }
      if (!flight.pending) {
        let resolve!: Pending["resolve"];
        let reject!: Pending["reject"];
        const promise = new Promise<unknown>((ok, fail) => { resolve = ok; reject = fail; });
        flight.pending = { readers: new Map(), resolve, reject, promise };
      }
      flight.pending.readers.set(isCurrent, read);
      return flight.pending.promise as Promise<T>;
    },
    dispose() { active = false; },
  };
}

/** Job-row revisions do not order separately resolved profile/quote fields. */
type Versioned = { id: string; jobVersion?: number; status?: string };
export function snapshotCanReplace(
  next: Versioned, current: Versioned | null, started: Versioned | null,
): boolean {
  if (!current || current.id !== next.id) return true;
  const valid = (v: number | undefined): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  if (valid(current.jobVersion)) {
    if (!valid(next.jobVersion)) return false;
    if (next.jobVersion !== current.jobVersion) return next.jobVersion > current.jobVersion;
    // An optimistic status can share its source row revision. Background
    // reads must not undo it; explicit mutation reconciliation can force it.
    if (next.status !== current.status) return false;
  }
  // A mutation/another read committed after this fetch began. With no strictly
  // newer durable revision, leave it in place and reconcile on the next read.
  return current === started;
}
