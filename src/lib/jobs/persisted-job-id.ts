/** UUID shape accepted for persisted service_requests IDs; optimistic IDs
 * such as `new` and `pending-*` exist only in the browser. */
export function isPersistedJobId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
