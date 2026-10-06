export type MotoristProfileRow = {
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  plate_number: string | null;
  address_text: string | null;
  default_lat: number | null;
  default_lng: number | null;
  nin_last4: string | null;
  bvn_last4: string | null;
  nin_verified: boolean;
  bvn_verified: boolean;
  identity_verified_at: string | null;
};

export type Detail = {
  user: {
    id: string;
    role: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    area: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    motorist_profiles: MotoristProfileRow | MotoristProfileRow[] | null;
  };
  jobs: Array<{
    id: string;
    service_type: string;
    status: string;
    description: string;
    pickup_address: string | null;
    created_at: string;
    completed_at: string | null;
  }>;
  bookings: Array<{
    id: string;
    status?: string;
    scheduled_at?: string | null;
    created_at: string;
  }>;
  payments: Array<{
    id: string;
    amount_kobo: number;
    status: string;
    currency: string;
    created_at: string;
  }>;
  reviews: Array<{
    id: string;
    rating?: number;
    comment?: string | null;
    created_at: string;
  }>;
  identity?: {
    roles: string[];
    hasMotorist: boolean;
    hasPro: boolean;
    payoutMethod: Record<string, unknown> | null;
    syncStatus: "in_sync" | "needs_sync" | "conflict" | "unknown";
    missingFields: string[];
    completedFields: string[];
    syncLog: Array<{
      id: string;
      action: string;
      result: string;
      error: string | null;
      created_at: string;
    }>;
    pendingMerges: unknown[];
  };
};

export function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}
