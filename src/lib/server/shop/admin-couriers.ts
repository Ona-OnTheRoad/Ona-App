import "server-only";
/** Courier provider registry for the Admin deliveries board. */

import { createServiceSupabase } from "@/lib/supabase/server";

export type CourierProviderInput = {
  id?: string;
  name: string;
  phone?: string | null;
  active?: boolean;
  notes?: string | null;
  isDefault?: boolean;
};

export async function listCourierProviders(): Promise<unknown[]> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("shop_courier_providers")
    .select("*")
    .order("active", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return data || [];
}

/** Create or update a courier provider (update when `id` is present). */
export async function upsertCourierProvider(
  input: CourierProviderInput,
): Promise<{ provider: unknown; duplicateName?: boolean }> {
  const sb = createServiceSupabase();
  const patch = {
    name: input.name,
    phone: input.phone ? String(input.phone) : null,
    active: input.active !== false,
    notes: input.notes ? String(input.notes) : null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await sb
      .from("shop_courier_providers")
      .update(patch)
      .eq("id", String(input.id))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { provider: data };
  }

  // Default provider: only one at a time
  if (input.isDefault) {
    await sb
      .from("shop_courier_providers")
      .update({ is_default: false })
      .eq("is_default", true);
  }
  const { data, error } = await sb
    .from("shop_courier_providers")
    .insert({
      name: patch.name,
      phone: patch.phone,
      active: patch.active,
      notes: patch.notes,
      is_default: input.isDefault === true,
    })
    .select()
    .single();
  if (error) {
    if (/duplicate|unique/i.test(error.message || "")) {
      return { provider: null, duplicateName: true };
    }
    throw new Error(error.message);
  }
  return { provider: data };
}

/** Toggle active / default / quick-edit phone/notes on an existing provider. */
export async function patchCourierProvider(
  id: string,
  input: { active?: boolean; phone?: string; notes?: string; isDefault?: boolean },
): Promise<unknown> {
  const sb = createServiceSupabase();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof input.active === "boolean") patch.active = input.active;
  if (typeof input.phone === "string") patch.phone = input.phone;
  if (typeof input.notes === "string") patch.notes = input.notes;
  if (input.isDefault === true) {
    await sb
      .from("shop_courier_providers")
      .update({ is_default: false })
      .eq("is_default", true);
    patch.is_default = true;
  }

  const { data, error } = await sb
    .from("shop_courier_providers")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
