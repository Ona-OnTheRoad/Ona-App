import "server-only";
/** Zero-result search demand capture for Admin review. */

import { createServiceSupabase } from "@/lib/supabase/server";

export class ProductRequestsNotMigratedError extends Error {
  constructor() {
    super("Product requests table not migrated (run 061)");
    this.name = "ProductRequestsNotMigratedError";
  }
}

export async function recordProductRequest(input: {
  userId?: string | null;
  tradeKey?: string;
  searchTerm: string;
  vehicleContext?: Record<string, unknown>;
  location?: string | null;
  notify?: boolean;
}): Promise<{ id: string }> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("shop_product_requests")
    .insert({
      user_id: input.userId ?? null,
      trade_key: input.tradeKey || "mechanic",
      search_term: input.searchTerm.slice(0, 200),
      vehicle_context: input.vehicleContext || {},
      location: input.location || null,
      notify_requested: Boolean(input.notify),
      status: "open",
    })
    .select("id")
    .single();
  if (error) {
    if (/relation .* does not exist|Could not find the table/i.test(error.message)) {
      throw new ProductRequestsNotMigratedError();
    }
    throw new Error(error.message);
  }
  return { id: data.id as string };
}
