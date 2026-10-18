/** Query scripts keep route characterization independent of adapter layout. */
export type QueryCall = {
  table: string;
  steps: Array<{ method: string; args: unknown[] }>;
};
export type QueryReply = {
  data: unknown;
  error?: { message: string } | null;
} | Error;

export function scriptedDb(replies: Record<string, QueryReply[]>) {
  const calls: QueryCall[] = [];
  const execute = (call: QueryCall) => {
    calls.push(call);
    const reply = replies[call.table]?.shift();
    if (!reply) throw new Error(`Unscripted query: ${call.table}`);
    if (reply instanceof Error) throw reply;
    return Promise.resolve(reply);
  };
  return {
    calls,
    from(table: string) {
      const call: QueryCall = { table, steps: [] };
      const chain = {
        select(...args: unknown[]) { call.steps.push({ method: "select", args }); return chain; },
        order(...args: unknown[]) { call.steps.push({ method: "order", args }); return chain; },
        limit(...args: unknown[]) { call.steps.push({ method: "limit", args }); return chain; },
        in(...args: unknown[]) { call.steps.push({ method: "in", args }); return chain; },
        or(...args: unknown[]) { call.steps.push({ method: "or", args }); return chain; },
        eq(...args: unknown[]) { call.steps.push({ method: "eq", args }); return chain; },
        update(...args: unknown[]) { call.steps.push({ method: "update", args }); return chain; },
        upsert(...args: unknown[]) { call.steps.push({ method: "upsert", args }); return chain; },
        maybeSingle() { call.steps.push({ method: "maybeSingle", args: [] }); return execute(call); },
        single() { call.steps.push({ method: "single", args: [] }); return execute(call); },
        then<TResult1 = QueryReply, TResult2 = never>(
          resolve?: ((value: QueryReply) => TResult1 | PromiseLike<TResult1>) | null,
          reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) { return execute(call).then(resolve, reject); },
      };
      return chain;
    },
  };
}

export const sharedProfile = {
  id: "user-1", role: "motorist", full_name: "Ada User",
  email: "ada@example.com", phone: "+2348000000000", is_active: true,
  created_at: "2026-01-01T00:00:00.000Z", city: "Lagos", area: "Lekki",
};
export const motorist = {
  user_id: "user-1", created_at: "2026-01-01T00:00:00.000Z",
  vehicle_make: "Toyota", vehicle_model: "Corolla", vehicle_year: "2020",
  bank_name: "Customer Bank", bank_account_number: "0000000001", bank_code: "001",
  nin_verified: true, bvn_verified: true, phone_verified: true,
  identity_review_status: "approved", identity_verified_at: "2026-01-02",
  gov_id_verified: true, gov_id_kind: "passport", gov_id_front_url: "id-front",
};
export const pro = {
  user_id: "user-1", created_at: "2026-02-01T00:00:00.000Z",
  primary_service: "mechanic", services: ["mechanic", "solar", "bad-service"],
  business_name: "Ada Repairs", bank_name: "Pro Bank", bank_code: "002",
  bank_account_number: "9999999999", docs_status: "approved",
  nin_verified: false, bvn_verified: false,
};
