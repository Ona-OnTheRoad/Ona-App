import { apiFail, apiOk } from "@/lib/server/api-json";
import {
  createContactChangeRequest,
  getContactChangeRequest,
  listContactChangeRequests,
  updateContactChangeStatus,
  redactContactRequest,
  verifyContactChangeCode,
} from "@/lib/server/security/contact-changes";
import { requireAdmin, AdminAuthError } from "@/lib/server/admin-auth";
import { requireUser } from "@/lib/server/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // A signed-in user may only open a request for their own account.
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const { userId: bodyUserId, changeType, oldValue, newValue, passwordConfirmed } = body;
    if (bodyUserId && bodyUserId !== auth.userId) {
      return apiFail("Forbidden", 403);
    }
    const userId = auth.userId;
    if (!changeType || !oldValue || !newValue) {
      return apiFail("Missing required fields", 400);
    }
    const result = await createContactChangeRequest({
      userId,
      changeType,
      oldValue,
      newValue,
      passwordConfirmed: !!passwordConfirmed,
      deviceInfo: { userAgent: req.headers.get("user-agent") || "" },
    });
    if ("error" in result) return apiFail(result.error, 400);
    return apiOk({ request: redactContactRequest(result.request) });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Failed", 500);
  }
}

export async function GET(req: Request) {
  try {
    // Own requests only. Admins review requests through /api/admin/security.
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    if (id) {
      const request = await getContactChangeRequest(id);
      // Same answer for "missing" and "someone else's": no existence oracle.
      if (!request || request.userId !== auth.userId) return apiFail("Not found", 404);
      return apiOk({ request: redactContactRequest(request) });
    }
    const requests = await listContactChangeRequests({
      status: status || undefined,
      userId: auth.userId,
    });
    return apiOk({ requests: requests.map(redactContactRequest) });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Failed", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    let admin;
    try {
      admin = await requireAdmin();
    } catch (err) {
      if (err instanceof AdminAuthError)
        return apiFail(err.message, err.status);
      return apiFail("Admin auth required", 401);
    }
    const body = await req.json();
    const { id, status, reason, action } = body;
    if (!id) return apiFail("Missing id", 400);
    if (action === "verify") {
      const { code, target } = body;
      if (!code || !target) return apiFail("Missing code or target", 400);
      const result = await verifyContactChangeCode(id, code, target);
      if ("error" in result) return apiFail(result.error, 400);
      return apiOk({ request: result.request ? redactContactRequest(result.request) : result.request });
    }
    if (!status) return apiFail("Missing status", 400);
    const result = await updateContactChangeStatus(
      id,
      status,
      admin.session.userId,
      reason,
    );
    if ("error" in result) return apiFail(result.error, 400);
    return apiOk({ request: redactContactRequest(result.request) });
  } catch (e) {
    return apiFail(e instanceof Error ? e.message : "Failed", 500);
  }
}
