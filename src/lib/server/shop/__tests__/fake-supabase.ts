/**
 * Tiny in-memory stand-in for the supabase-js query builder, just enough for
 * the shop server code (select/insert/update/delete/upsert, eq/neq/in/lte/gte,
 * order/limit, single/maybeSingle, rpc). Not a general mock: it exists so the
 * order / payment logic can be driven through real read-modify-write sequences.
 */
type Row = Record<string, unknown>;
type Filter = (r: Row) => boolean;
type RpcHandler = (args: Record<string, unknown>) => unknown | Promise<unknown>;

export type FakeDb = {
  tables: Record<string, Row[]>;
  rpcs: Record<string, RpcHandler>;
  rpcCalls: Array<{ name: string; args: Record<string, unknown> }>;
  /** per-table forced error for the next insert/update/etc. */
  failNext: Record<string, { message: string; code?: string } | undefined>;
  client: { from: (t: string) => unknown; rpc: (n: string, a: Record<string, unknown>) => Promise<unknown> };
};

let seq = 0;

export function makeFakeDb(seed: Record<string, Row[]> = {}): FakeDb {
  const db: FakeDb = {
    tables: Object.fromEntries(
      Object.entries(seed).map(([k, v]) => [k, v.map((r) => ({ ...r }))]),
    ),
    rpcs: {},
    rpcCalls: [],
    failNext: {},
    client: {
      from: (t) => builder(db, t),
      rpc: async (name, args) => {
        db.rpcCalls.push({ name, args });
        const h = db.rpcs[name];
        if (!h) return { data: null, error: { message: `no rpc ${name}` } };
        try {
          return { data: await h(args), error: null };
        } catch (e) {
          return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
        }
      },
    },
  };
  return db;
}

function builder(db: FakeDb, table: string) {
  db.tables[table] ??= [];
  let op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  let payload: Row | Row[] | null = null;
  const filters: Filter[] = [];
  let orderBy: { col: string; asc: boolean } | null = null;
  let lim: number | null = null;
  let countHead = false;
  let wantRows = false;
  let upsertConflict: string | null = null;

  const exec = (): { data: unknown; error: unknown; count?: number } => {
    const forced = db.failNext[table];
    if (forced && op !== "select") {
      db.failNext[table] = undefined;
      return { data: null, error: forced };
    }
    const rows = db.tables[table];
    const match = (r: Row) => filters.every((f) => f(r));
    if (op === "insert") {
      const list = (Array.isArray(payload) ? payload : [payload]) as Row[];
      const out = list.map((r) => ({ id: `${table}-${++seq}`, ...r }));
      rows.push(...out);
      return { data: wantRows ? out : null, error: null };
    }
    if (op === "upsert") {
      const list = (Array.isArray(payload) ? payload : [payload]) as Row[];
      for (const r of list) {
        const key = upsertConflict;
        const hit = key ? rows.find((x) => x[key] === r[key]) : undefined;
        if (hit) Object.assign(hit, r);
        else rows.push({ id: `${table}-${++seq}`, ...r });
      }
      return { data: null, error: null };
    }
    if (op === "update") {
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, payload as Row));
      return { data: wantRows ? hit.map((r) => ({ ...r })) : null, error: null };
    }
    if (op === "delete") {
      const keep = rows.filter((r) => !match(r));
      const removed = rows.length - keep.length;
      db.tables[table] = keep;
      return { data: null, error: null, count: removed };
    }
    let res = rows.filter(match).map((r) => ({ ...r }));
    if (orderBy) {
      const { col, asc } = orderBy;
      res.sort((a, b) =>
        String(a[col] ?? "") < String(b[col] ?? "") ? (asc ? -1 : 1) : asc ? 1 : -1,
      );
    }
    if (lim != null) res = res.slice(0, lim);
    if (countHead) return { data: null, error: null, count: res.length };
    return { data: res, error: null };
  };

  const api: Record<string, unknown> = {};
  const self = api as {
    [k: string]: (...a: unknown[]) => unknown;
  };
  self.select = (_cols?: unknown, opts?: unknown) => {
    if (op === "insert" || op === "update" || op === "upsert") wantRows = true;
    if ((opts as { head?: boolean } | undefined)?.head) countHead = true;
    return api;
  };
  self.insert = (p: unknown) => ((op = "insert"), (payload = p as Row | Row[]), api);
  self.update = (p: unknown) => ((op = "update"), (payload = p as Row), api);
  self.upsert = (p: unknown, o?: unknown) => (
    (op = "upsert"),
    (payload = p as Row | Row[]),
    (upsertConflict = (o as { onConflict?: string } | undefined)?.onConflict ?? null),
    api
  );
  self.delete = () => ((op = "delete"), api);
  self.eq = (c: unknown, v: unknown) => (filters.push((r) => r[c as string] === v), api);
  self.neq = (c: unknown, v: unknown) => (filters.push((r) => r[c as string] !== v), api);
  self.in = (c: unknown, v: unknown) => (
    filters.push((r) => (v as unknown[]).includes(r[c as string])),
    api
  );
  self.ilike = (c: unknown, pattern: unknown) => {
    const needle = String(pattern).replace(/%/g, "").toLowerCase();
    filters.push((r) => String(r[c as string] ?? "").toLowerCase().includes(needle));
    return api;
  };
  self.lte = (c: unknown, v: unknown) => (filters.push((r) => String(r[c as string]) <= String(v)), api);
  self.gte = (c: unknown, v: unknown) => (filters.push((r) => String(r[c as string]) >= String(v)), api);
  self.order = (c: unknown, o?: unknown) => (
    (orderBy = { col: c as string, asc: (o as { ascending?: boolean } | undefined)?.ascending !== false }),
    api
  );
  self.limit = (n: unknown) => ((lim = n as number), api);
  self.maybeSingle = async () => {
    const r = exec();
    const d = r.data as Row[] | null;
    return { data: d?.[0] ?? null, error: r.error };
  };
  self.single = async () => {
    const r = exec();
    const d = r.data as Row[] | null;
    return { data: d?.[0] ?? null, error: r.error ?? (d?.[0] ? null : { message: "no row" }) };
  };
  (api as { then: unknown }).then = (
    resolve: (v: unknown) => unknown,
    reject?: (e: unknown) => unknown,
  ) => Promise.resolve(exec()).then(resolve, reject);
  return api;
}
