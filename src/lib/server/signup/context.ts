import "server-only";
import type { SignupInput } from "@/lib/server/signup/schema";
import type { createServiceSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

/** Values worked out once per signup request and shared by every step. */
export type SignupContext = {
  supabase: ReturnType<typeof createServiceSupabase>;
  /** Parsed body; `phone` is already the canonical number. */
  input: SignupInput;
  /** Lower-cased, trimmed email. */
  email: string;
  role: UserRole;
  /** Digits only. */
  nin: string;
  bvn: string;
  hasNin: boolean;
  hasBvn: boolean;
  /** Common fields for every `signup_events` row of this request. */
  eventBase: {
    email: string;
    full_name: string;
    phone: string;
    account_type: SignupInput["accountType"];
    gender: SignupInput["gender"];
    date_of_birth: string;
  };
};

/** Stored verified flags echoed to the client (never derived from digits). */
export type VerifiedFlags = { ninVerified: boolean; bvnVerified: boolean };
