import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  mapConversationToThread,
  type ConversationRow,
  type MessageRow,
} from "@/lib/supabase/mappers";
import type { ProService } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Conversation list for a user (motorist or repair pro side). Mirrors what
 * the browser used to query directly, with an explicit ownership check
 * instead of relying on RLS.
 */
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Server not configured", 503);
  }
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const role = searchParams.get("role");
  if (!userId || (role !== "motorist" && role !== "professional")) {
    return apiFail("userId and role required", 400);
  }
  if (userId !== auth.userId) {
    return apiFail("Forbidden", 403, "forbidden");
  }

  try {
    const sb = createServiceSupabase();
    const col = role === "professional" ? "repair_pro_id" : "motorist_id";
    const { data: convs, error } = await sb
      .from("conversations")
      .select("*")
      .eq(col, userId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(20);
    if (error) return apiFail(error.message, 500);
    if (!convs?.length) return apiOk({ threads: [] });

    const convList = convs as ConversationRow[];
    const convIds = convList.map((c) => c.id);
    const peopleIds = [
      ...new Set(convList.flatMap((c) => [c.motorist_id, c.repair_pro_id])),
    ];
    const requestIds = convList
      .map((c) => c.request_id)
      .filter(Boolean) as string[];

    const [{ data: allMsgs }, { data: names }, { data: jobs }] =
      await Promise.all([
        sb
          .from("messages")
          .select("id, conversation_id, sender_id, body, created_at, read_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
          .limit(200),
        sb
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", peopleIds),
        requestIds.length
          ? sb
              .from("service_requests")
              .select("id, service_type")
              .in("id", requestIds)
          : Promise.resolve({
              data: [] as { id: string; service_type: string }[],
            }),
      ]);

    const byId = new Map(
      (
        names as
          | { id: string; full_name: string; avatar_url: string | null }[]
          | null
      )?.map((n) => [n.id, n]) ?? [],
    );
    const jobById = new Map(
      (jobs as { id: string; service_type: string }[] | null)?.map((j) => [
        j.id,
        j.service_type,
      ]) ?? [],
    );
    const msgsByConv = new Map<string, MessageRow[]>();
    for (const m of (allMsgs as MessageRow[]) || []) {
      const arr = msgsByConv.get(m.conversation_id) || [];
      arr.push(m);
      msgsByConv.set(m.conversation_id, arr);
    }

    const threads = convList.map((c) =>
      mapConversationToThread(
        c,
        msgsByConv.get(c.id) || [],
        {
          motoristName: byId.get(c.motorist_id)?.full_name || "Customer",
          technicianName: byId.get(c.repair_pro_id)?.full_name || "Repair Pro",
          serviceType:
            (c.request_id
              ? (jobById.get(c.request_id) as ProService | undefined)
              : undefined) || "mechanic",
          photo: byId.get(c.repair_pro_id)?.avatar_url || "",
        },
        userId,
      ),
    );
    return apiOk({ threads });
  } catch (e) {
    return apiFail(
      e instanceof Error ? e.message : "Could not load conversations",
      500,
    );
  }
}
