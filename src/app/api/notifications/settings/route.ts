import { apiFail, apiOk } from "@/lib/server/api-json";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { getUserFromRequest } from "@/lib/server/auth-utils";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  access_token: z.string().optional(),
  enabled: z.boolean().optional(),
  categories: z
    .object({
      requests: z.boolean().optional(),
      messages: z.boolean().optional(),
      payments: z.boolean().optional(),
      system: z.boolean().optional(),
      promotional: z.boolean().optional(),
    })
    .optional(),
  delivery: z
    .object({
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      inApp: z.boolean().optional(),
    })
    .optional(),
  quietHours: z
    .object({
      enabled: z.boolean().optional(),
      startHour: z.number().optional(),
      endHour: z.number().optional(),
    })
    .optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  jobAlerts: z.boolean().optional(),
  messageAlerts: z.boolean().optional(),
  promotionalAlerts: z.boolean().optional(),
  quietHoursStart: z.union([z.string(), z.number()]).optional(),
  quietHoursEnd: z.union([z.string(), z.number()]).optional(),
});

export async function PATCH(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Database not configured", 503, "no_db");
  }
  const user = await getUserFromRequest(req);
  if (!user) return apiFail("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiFail("Invalid body", 400);

  const supabase = createServiceSupabase();
  const existing = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prev =
    (existing.data?.notification_preferences as Record<string, unknown>) || {};
  const prevCats = (prev.categories as Record<string, boolean>) || {};
  const prevDelivery = (prev.delivery as Record<string, boolean>) || {};
  const prevQuiet = (prev.quietHours as Record<string, unknown>) || {};

  const merged = {
    ...prev,
    enabled: parsed.data.enabled ?? (prev.enabled as boolean | undefined) ?? true,
    categories: {
      requests: true,
      messages: true,
      payments: true,
      system: true,
      promotional: false,
      ...prevCats,
      ...(parsed.data.categories || {}),
      ...(parsed.data.jobAlerts !== undefined
        ? { requests: parsed.data.jobAlerts }
        : {}),
      ...(parsed.data.messageAlerts !== undefined
        ? { messages: parsed.data.messageAlerts }
        : {}),
      ...(parsed.data.promotionalAlerts !== undefined
        ? { promotional: parsed.data.promotionalAlerts }
        : {}),
    },
    delivery: {
      push: true,
      sms: false,
      email: true,
      inApp: true,
      ...prevDelivery,
      ...(parsed.data.delivery || {}),
      ...(parsed.data.pushEnabled !== undefined
        ? { push: parsed.data.pushEnabled }
        : {}),
      ...(parsed.data.emailEnabled !== undefined
        ? { email: parsed.data.emailEnabled }
        : {}),
      ...(parsed.data.smsEnabled !== undefined
        ? { sms: parsed.data.smsEnabled }
        : {}),
    },
    quietHours: {
      enabled: true,
      startHour: 22,
      endHour: 7,
      ...prevQuiet,
      ...(parsed.data.quietHours || {}),
      ...(parsed.data.quietHoursStart !== undefined
        ? { startHour: Number(parsed.data.quietHoursStart) }
        : {}),
      ...(parsed.data.quietHoursEnd !== undefined
        ? { endHour: Number(parsed.data.quietHoursEnd) }
        : {}),
    },
    // Backwards-compatibility flat keys
    pushEnabled:
      parsed.data.pushEnabled ??
      parsed.data.delivery?.push ??
      prevDelivery.push ??
      (prev.pushEnabled as boolean | undefined) ??
      true,
    emailEnabled:
      parsed.data.emailEnabled ??
      parsed.data.delivery?.email ??
      prevDelivery.email ??
      (prev.emailEnabled as boolean | undefined) ??
      true,
    smsEnabled:
      parsed.data.smsEnabled ??
      parsed.data.delivery?.sms ??
      prevDelivery.sms ??
      (prev.smsEnabled as boolean | undefined) ??
      false,
    jobAlerts:
      parsed.data.jobAlerts ??
      parsed.data.categories?.requests ??
      prevCats.requests ??
      (prev.jobAlerts as boolean | undefined) ??
      true,
    messageAlerts:
      parsed.data.messageAlerts ??
      parsed.data.categories?.messages ??
      prevCats.messages ??
      (prev.messageAlerts as boolean | undefined) ??
      true,
    promotionalAlerts:
      parsed.data.promotionalAlerts ??
      parsed.data.categories?.promotional ??
      prevCats.promotional ??
      (prev.promotionalAlerts as boolean | undefined) ??
      false,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_preferences: merged })
    .eq("id", user.id);

  if (error) return apiFail(error.message, 500);
  return apiOk({ saved: true, preferences: merged });
}

export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return apiFail("Database not configured", 503, "no_db");
  }
  const user = await getUserFromRequest(req);
  if (!user) return apiFail("Unauthorized", 401);

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  if (error) return apiFail(error.message, 500);
  return apiOk(data?.notification_preferences || {});
}
