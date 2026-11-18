/** Minimal in-memory PostgREST stand-in for broadcast tests. */
export type Row = Record<string, unknown>;
export type Tables = Record<string, Row[]>;

export function makeFakeSupabase(
  tables: Tables,
  rpcs: Record<string, (args: Row) => unknown> = {},
  calls: { rpc: Array<{ name: string; args: Row }> } = { rpc: [] },
) {
  const from = (name: string) => {
    const rows = (tables[name] ??= []);
    const filters: Array<(r: Row) => boolean> = [];
    let patch: Row | null = null;
    let upsertRows: Row[] | null = null;
    let upsertKey: string[] = [];
    let ignoreDup = false;
    let insertRows: Row[] | null = null;
    let single = false;
    let max = Infinity;

    const q: Record<string, unknown> = {};
    const add = (f: (r: Row) => boolean) => {
      filters.push(f);
      return q;
    };
    q.select = () => q;
    q.eq = (k: string, v: unknown) => add((r) => r[k] === v);
    q.neq = (k: string, v: unknown) => add((r) => r[k] !== v);
    q.is = (k: string, v: unknown) => add((r) => (r[k] ?? null) === v);
    q.in = (k: string, vs: unknown[]) => add((r) => vs.includes(r[k]));
    q.not = (k: string, op: string, v: string) => {
      if (op === "in") {
        const set = v.replace(/[()]/g, "").split(",");
        return add((r) => !set.includes(String(r[k])));
      }
      return add((r) => r[k] !== v);
    };
    q.match = (m: Row) => add((r) => Object.entries(m).every(([k, v]) => r[k] === v));
    q.order = () => q;
    q.limit = (n: number) => {
      max = n;
      return q;
    };
    q.update = (p: Row) => {
      patch = p;
      return q;
    };
    q.insert = (r: Row | Row[]) => {
      insertRows = Array.isArray(r) ? r : [r];
      return q;
    };
    q.upsert = (r: Row | Row[], o?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
      upsertRows = Array.isArray(r) ? r : [r];
      upsertKey = (o?.onConflict ?? "id").split(",").map((s) => s.trim());
      ignoreDup = Boolean(o?.ignoreDuplicates);
      return q;
    };
    q.maybeSingle = () => {
      single = true;
      return q;
    };
    q.single = q.maybeSingle;

    const exec = () => {
      if (insertRows) {
        rows.push(...insertRows.map((r) => ({ ...r })));
        return { data: null, error: null };
      }
      if (upsertRows) {
        for (const r of upsertRows) {
          const hit = rows.find((x) => upsertKey.every((k) => x[k] === r[k]));
          if (hit) {
            if (!ignoreDup) Object.assign(hit, r);
          } else rows.push({ ...r });
        }
        return { data: null, error: null };
      }
      const hit = rows.filter((r) => filters.every((f) => f(r))).slice(0, max);
      if (patch) {
        hit.forEach((r) => Object.assign(r, patch));
        return { data: single ? (hit[0] ? { ...hit[0] } : null) : hit.map((r) => ({ ...r })), error: null };
      }
      return { data: single ? (hit[0] ? { ...hit[0] } : null) : hit.map((r) => ({ ...r })), error: null };
    };
    q.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(exec()).then(resolve, reject);
    return q;
  };

  const rpc = async (name: string, args: Row) => {
    calls.rpc.push({ name, args });
    const fn = rpcs[name];
    if (!fn) return { data: null, error: { message: `no rpc ${name}` } };
    return { data: fn(args), error: null };
  };
  return { from, rpc } as never;
}
