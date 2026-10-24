import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeQuery, FakeSupabase, type AuthResult, type Row } from "@/test-utils/fake-supabase";

const mocks = vi.hoisted(() => ({
  service: vi.fn(), getUser: vi.fn(), anonSignIn: vi.fn(), serviceSignIn: vi.fn(),
  createUser: vi.fn(), identitySync: vi.fn(), mergeDetect: vi.fn(), sendMail: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser, signInWithPassword: mocks.anonSignIn } }),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true, getSupabaseUrl: () => "https://example.test", getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: async () => ({ ok: true }), rateLimitUnavailableResponse: () => null,
}));
vi.mock("@/lib/server/resend", () => ({ sendSignupConfirmationEmail: mocks.sendMail }));
vi.mock("@/lib/server/identity/identity-sync", () => ({
  runIdentitySync: mocks.identitySync, detectMergeCandidatesForUser: mocks.mergeDetect,
}));
import { POST } from "@/app/api/auth/signup/route";

/**
 * Mirrors supabase-js: once signInWithPassword succeeds on a client, later
 * PostgREST calls carry the user's JWT, so writes run as `authenticated`.
 * Migration 077 revoked those writes; signup_events is admin-only under RLS.
 */
const LOCKED = new Set(["profiles", "motorist_profiles", "repair_pro_profiles", "signup_events"]);

class GuardedQuery extends FakeQuery {
  then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
    const write = Boolean(this.insertRow || this.updateRow || this.isDelete);
    if (write && (this.db as ServiceFake).sessionUser && LOCKED.has(this.table)) {
      resolve({ data: null, error: { message: `permission denied for table ${this.table}`, code: "42501" } });
      return;
    }
    super.then(resolve, reject);
  }
}

class ServiceFake extends FakeSupabase {
  sessionUser: string | null = null;
  constructor(tables: Record<string, Row[]>, users: Row[]) {
    super(tables);
    const auth = {
      admin: {
        createUser: (input: Record<string, unknown>) => mocks.createUser(input),
        getUserById: async (id: string) => ({ data: { user: users.find((u) => u.id === id) ?? null }, error: null }),
      },
      signInWithPassword: async (input: Record<string, unknown>) => {
        const res = (await mocks.serviceSignIn(input)) as AuthResult;
        if (res.data?.session) this.sessionUser = String(res.data.user?.id);
        return res;
      },
    };
    (this as unknown as { auth: unknown }).auth = auth;
  }
  from(table: string) {
    return new GuardedQuery(this, table);
  }
}

const EMAIL = "ada@ona.test";
const PASSWORD = "Strong#Pass1";
const PHONE = "+2348012345678";
const user = { id: "user-1", email: EMAIL };

function signedIn(id = "user-1"): AuthResult {
  return { data: { user: { id }, session: { access_token: `access-${id}`, refresh_token: "refresh", expires_at: 1 } }, error: null };
}
function existingMotorist() {
  return {
    profiles: [{ id: "user-1", email: EMAIL, phone: PHONE, role: "motorist", full_name: "Ada User", avatar_url: null, is_active: true }],
    motorist_profiles: [{ user_id: "user-1", vehicle_make: "Toyota" }],
  };
}
function proBody(extra: Record<string, unknown> = {}) {
  return {
    email: EMAIL, password: PASSWORD, fullName: "Ada User", phone: PHONE, accountType: "professional",
    gender: "female", dateOfBirth: "1990-05-05", city: "Lagos", area: "Yaba", businessName: "Ada Autos",
    primaryService: "mechanic", services: ["mechanic"], bio: "Engine work", yearsExperience: "5",
    guarantor: { fullName: "Bola Guarantor", phone: "+2348098765432", relationship: "Brother" }, ...extra,
  };
}
function post(body: Record<string, unknown>) {
  return POST(new Request("https://ona.test/api/auth/signup", { method: "POST", body: JSON.stringify(body) }));
}
function setup(tables: Record<string, Row[]>, users: Row[] = [user]) {
  const sb = new ServiceFake(tables, users);
  mocks.service.mockReturnValue(sb);
  return sb;
}
const successEvents = (sb: ServiceFake) => (sb.rows.signup_events ?? []).filter((e) => e.success === true);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.anonSignIn.mockResolvedValue(signedIn());
  mocks.serviceSignIn.mockResolvedValue(signedIn());
  mocks.createUser.mockResolvedValue({ data: { user }, error: null });
  mocks.identitySync.mockResolvedValue(undefined);
  mocks.mergeDetect.mockResolvedValue(undefined);
  mocks.sendMail.mockResolvedValue({ ok: true });
});

describe("POST /api/auth/signup service-client session isolation", () => {
  it("lets a signed-in motorist attach the Repair Pro role and keeps the motorist side", async () => {
    const sb = setup(existingMotorist());
    const res = await post(proBody({ access_token: "valid-access-token" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ userId: "user-1", createdNew: false, role: "repair_pro", session: { access_token: "access-user-1" } });
    expect(sb.rows.profiles).toHaveLength(1);
    expect(sb.rows.profiles[0]).toMatchObject({ id: "user-1", role: "repair_pro", is_active: true });
    expect(sb.rows.repair_pro_profiles).toEqual([expect.objectContaining({ user_id: "user-1", is_online: false, visibility_tier: 1 })]);
    expect(sb.rows.motorist_profiles).toEqual([{ user_id: "user-1", vehicle_make: "Toyota" }]);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();
    expect(mocks.anonSignIn).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
    expect(successEvents(sb)).toHaveLength(1);
  });

  it("finishes the existing-email recovery path with service-role writes", async () => {
    const sb = setup(existingMotorist());
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: { message: "User already registered", status: 422 } });
    const res = await post(proBody());

    expect(res.status).toBe(200);
    expect(sb.rows.profiles[0]).toMatchObject({ id: "user-1", role: "repair_pro" });
    expect(sb.rows.repair_pro_profiles).toHaveLength(1);
    expect(sb.rows.motorist_profiles).toHaveLength(1);
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();
    expect(successEvents(sb)).toHaveLength(1);
  });

  it("keeps brand-new signup unchanged and returns a browser session", async () => {
    const sb = setup({});
    const res = await post(proBody());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ userId: "user-1", createdNew: true, role: "repair_pro", accountType: "professional", session: { access_token: "access-user-1", refresh_token: "refresh" } });
    expect(sb.rows.profiles).toEqual([expect.objectContaining({ id: "user-1", role: "repair_pro" })]);
    expect(sb.rows.repair_pro_profiles).toHaveLength(1);
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();
    expect(successEvents(sb)).toHaveLength(1);
  });

  it("rejects an attach with the wrong password and writes nothing", async () => {
    const sb = setup(existingMotorist());
    mocks.anonSignIn.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } });
    mocks.serviceSignIn.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } });
    const res = await post(proBody({ access_token: "valid-access-token" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("password_required");
    expect(sb.upserts).toEqual([]);
    expect(sb.rows.profiles[0]).toMatchObject({ role: "motorist" });
    expect(sb.rows.repair_pro_profiles).toBeUndefined();
  });
});
