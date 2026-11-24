import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { mapNotificationRow } from "@/lib/server/notifications";
import { parseAudience } from "@/lib/notifications/audience";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications?userId=
 * Lists notifications for the authenticated user only.
 */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail(
      "Supabase is not configured",
      503,
      "supabase_not_configured",
    );
  }

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();
  if (!userId) {
    return apiFail("userId required", 400, "validation");
  }
  if (userId !== auth.userId) {
    return apiFail("Forbidden", 403, "forbidden");
  }

  // Active side of the app: a dual-role user only sees that side's rows
  // (rows with no audience, e.g. security/system, show in both).
  const role = parseAudience(searchParams.get("role"));

  const sb = createServiceSupabase();
  let query = sb
    .from("notifications")
    .select(
      "id,user_id,category,priority,title,body,href,action_type,group_key,job_id,job_status,message_text,read_at,created_at,audience",
    )
    .eq("user_id", auth.userId);
  if (role) query = query.or(`audience.is.null,audience.eq.${role}`);
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (
      error.code === "PGRST205" ||
      /Could not find the table|schema cache|does not exist/i.test(
        error.message || "",
      )
    ) {
      return apiOk({ notifications: [], unreadCount: 0, tableMissing: true });
    }
    return apiFail(error.message, 500);
  }

  const rows = (data || []).map((r) =>
    mapNotificationRow(r as Record<string, unknown>),
  );
  const unreadCount = rows.filter((n) => !n.readAt).length;
  return apiOk({ notifications: rows, unreadCount });
}
