import "server-only";
import { compareNames, type NameMatch } from "@/lib/server/identity/name-match";
import { verifyNinWithFallback } from "@/lib/server/identity/nin-lookup";
import {
  ID_LOOKUP_NOT_CONFIGURED,
  isProviderOutage,
  verifyBvnWithPrembly,
  type PremblyVerifyResult,
} from "@/lib/server/prembly";

export type IdKind = "nin" | "bvn";

/**
 * verified    — a live provider confirmed the number
 * rejected    — a live provider (or the format check) refused it
 * unavailable — the provider could not be asked (not configured, network, 5xx)
 * format_only — no provider outside production; only the shape was checked
 */
export type IdLookupStatus = "verified" | "rejected" | "unavailable" | "format_only";

/** Evidence for Care. Never holds the ID number itself. */
export type IdLookupRecord = {
  kind: IdKind;
  status: IdLookupStatus;
  provider: "prembly" | "local";
  mode: "live" | "sandbox_format";
  reference: string | null;
  matchedName: string | null;
  code: string | null;
  /** The provider was down and a cached earlier confirmation was used. */
  cached: boolean;
  checkedAt: string;
  nameMatch: { profile: NameMatch; bankAccount: NameMatch };
};

export type IdLookupNames = {
  profileName?: string | null;
  bankAccountName?: string | null;
};

/** Auth and billing errors: the provider was never really asked. */
const UNAVAILABLE_HTTP = new Set(["401", "402", "403"]);

function statusOf(result: PremblyVerifyResult): IdLookupStatus {
  if (result.ok) return result.mode === "live" ? "verified" : "format_only";
  const code = String(result.code ?? "");
  if (code === ID_LOOKUP_NOT_CONFIGURED || isProviderOutage(result)) return "unavailable";
  return UNAVAILABLE_HTTP.has(code) ? "unavailable" : "rejected";
}

export function buildIdLookupRecord(
  kind: IdKind,
  result: PremblyVerifyResult,
  names: IdLookupNames = {},
  now: Date = new Date(),
): IdLookupRecord {
  const status = statusOf(result);
  const holder = result.ok
    ? { fullName: result.fullName, firstName: result.firstName, lastName: result.lastName }
    : {};
  const compared = status === "verified";
  return {
    kind,
    status,
    provider: result.provider,
    mode: result.mode,
    reference: result.ok ? result.reference || null : null,
    matchedName: result.ok ? result.fullName || null : null,
    code: result.ok ? null : result.code || null,
    cached: result.ok && Boolean(result.cached),
    checkedAt: now.toISOString(),
    nameMatch: {
      profile: compared ? compareNames(holder, names.profileName) : "unknown",
      bankAccount: compared ? compareNames(holder, names.bankAccountName) : "unknown",
    },
  };
}

/** Ask the provider about one number. Never throws. */
export async function lookupId(
  kind: IdKind,
  number: string,
  names: IdLookupNames = {},
): Promise<IdLookupRecord> {
  let result: PremblyVerifyResult;
  try {
    result =
      kind === "nin"
        ? await verifyNinWithFallback(number)
        : await verifyBvnWithPrembly(number);
  } catch {
    result = {
      ok: false,
      provider: "prembly",
      mode: "live",
      message: "Lookup failed.",
      code: "NETWORK",
    };
  }
  return buildIdLookupRecord(kind, result, names);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Returns a copy of `gov_id_meta` with the records under `idLookup`. */
export function mergeIdLookup(
  meta: unknown,
  records: IdLookupRecord[],
): Record<string, unknown> {
  const base = asObject(meta);
  if (records.length === 0) return base;
  const idLookup = { ...asObject(base.idLookup) };
  for (const record of records) idLookup[record.kind] = record;
  return { ...base, idLookup };
}

function hasMismatch(record: unknown): boolean {
  const nameMatch = asObject(asObject(record).nameMatch);
  return nameMatch.profile === "mismatch" || nameMatch.bankAccount === "mismatch";
}

/** Shape shown in the admin review rows. */
export function idLookupSummary(meta: unknown): {
  nin: unknown;
  bvn: unknown;
  name_mismatch: boolean;
} {
  const idLookup = asObject(asObject(meta).idLookup);
  const nin = idLookup.nin ?? null;
  const bvn = idLookup.bvn ?? null;
  return { nin, bvn, name_mismatch: hasMismatch(nin) || hasMismatch(bvn) };
}
