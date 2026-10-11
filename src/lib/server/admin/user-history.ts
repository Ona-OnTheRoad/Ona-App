import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";

export type AdminHistoryRow = Record<string, unknown>;

export type AdminUserHistoryReader = {
  loadJobs(): Promise<AdminHistoryRow[]>;
  loadBookings(): Promise<AdminHistoryRow[]>;
  loadPayments(): Promise<AdminHistoryRow[]>;
  loadReviews(): Promise<AdminHistoryRow[]>;
};

/** Cross-domain admin read model; its service client stays inside this boundary. */
export function createAdminUserHistoryReader(userId: string): AdminUserHistoryReader {
  const supabase = createServiceSupabase();
  return {
    async loadJobs() {
      const { data } = await supabase
        .from("service_requests")
        .select(
          "id, service_type, status, description, pickup_address, created_at, completed_at, motorist_id, repair_pro_id",
        )
        .or(`motorist_id.eq.${userId},repair_pro_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as AdminHistoryRow[];
    },
    async loadBookings() {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .or(`motorist_id.eq.${userId},repair_pro_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as AdminHistoryRow[];
    },
    async loadPayments() {
      const { data } = await supabase
        .from("payments")
        .select(
          "id, amount_kobo, status, currency, provider, created_at, paid_at, motorist_id, repair_pro_id",
        )
        .or(`motorist_id.eq.${userId},repair_pro_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as AdminHistoryRow[];
    },
    async loadReviews() {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .or(`motorist_id.eq.${userId},repair_pro_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as AdminHistoryRow[];
    },
  };
}
