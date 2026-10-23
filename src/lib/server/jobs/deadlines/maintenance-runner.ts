import "server-only";

export type MaintenanceFamily =
  | "jobDeadlines"
  | "unaccepted"
  | "zombies"
  | "pairing"
  | "scheduledDispatch"
  | "payoutRetry";

export const FAMILY_MIN_INTERVAL_MS: Record<MaintenanceFamily, number> = {
  jobDeadlines: 30_000,
  unaccepted: 30_000,
  zombies: 60_000,
  pairing: 30_000,
  scheduledDispatch: 30_000,
  payoutRetry: 60_000,
};

interface FamilyState<T = unknown> {
  inFlight: Promise<T> | null;
  lastCompletedAt: number;
}

const families = new Map<MaintenanceFamily, FamilyState>();
let pairingRecoveryInFlight: Promise<{
  checked: number;
  timedOut: number;
  expired: number;
}> | null = null;

function getFamilyState<T>(family: MaintenanceFamily): FamilyState<T> {
  let state = families.get(family) as FamilyState<T> | undefined;
  if (!state) {
    state = { inFlight: null, lastCompletedAt: 0 };
    families.set(family, state as FamilyState);
  }
  return state;
}

export interface RunFamilyOptions<T> {
  bypassThrottle?: boolean;
  throttledValue: T;
  nowMs?: number;
}

/**
 * Coalesces concurrent in-flight executions for a maintenance family and
 * enforces a minimum interval between completed browser-triggered runs.
 * Failed runs do not advance `lastCompletedAt`, so retries remain eligible.
 */
export async function runMaintenanceFamily<T>(
  family: MaintenanceFamily,
  operation: () => Promise<T>,
  options: RunFamilyOptions<T>,
): Promise<{ value: T; throttled: boolean; coalesced: boolean }> {
  const state = getFamilyState<T>(family);
  if (state.inFlight) {
    const value = await state.inFlight;
    return { value, throttled: false, coalesced: true };
  }

  const now = options.nowMs ?? Date.now();
  const minIntervalMs = FAMILY_MIN_INTERVAL_MS[family];
  if (
    !options.bypassThrottle &&
    state.lastCompletedAt > 0 &&
    now - state.lastCompletedAt < minIntervalMs
  ) {
    return { value: options.throttledValue, throttled: true, coalesced: false };
  }

  let promise: Promise<T> | null = null;
  promise = (async () => {
    try {
      const result = await operation();
      state.lastCompletedAt = options.nowMs ?? Date.now();
      return result;
    } finally {
      if (state.inFlight === promise) {
        state.inFlight = null;
      }
    }
  })();

  state.inFlight = promise;
  const value = await promise;
  return { value, throttled: false, coalesced: false };
}

/**
 * Shares an in-flight pairing recovery sweep across concurrent requests on the
 * same server instance before hitting the database lease RPC.
 */
export async function runCoalescedPairingRecovery<
  T extends { checked: number; timedOut: number; expired: number },
>(operation: () => Promise<T>): Promise<T> {
  if (pairingRecoveryInFlight) {
    return (await pairingRecoveryInFlight) as T;
  }
  let promise: Promise<T> | null = null;
  promise = (async () => {
    try {
      return await operation();
    } finally {
      if (pairingRecoveryInFlight === promise) {
        pairingRecoveryInFlight = null;
      }
    }
  })();
  pairingRecoveryInFlight = promise;
  return promise;
}

export function resetMaintenanceRunnerForTests(): void {
  families.clear();
  pairingRecoveryInFlight = null;
}
