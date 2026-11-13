import "server-only";
import { phoneLookupVariants } from "@/lib/server/phone-match";
import type { createServiceSupabase } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceSupabase>;

export type PhoneOwner = { id: string; email: string | null; phone: string | null };

/** Safety cap on candidates the database may return (real matches are a handful). */
const MAX_CANDIDATES = 200;

/**
 * The part of a number that identifies the line: its last 10 digits. Two numbers
 * are "the same" when these match, whatever country prefix, spaces or leading 0
 * they were typed or stored with. Null when there are too few digits to judge.
 */
export function phoneTail(raw: string | null | undefined): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

/**
 * Every account that already uses this number, searched across ALL profiles.
 *
 * The database narrows the table (exact stored formats via an index, plus a
 * digits-in-order pattern that also catches values stored with spaces or
 * dashes); each candidate is then confirmed with the same last-10-digits rule,
 * so a loose pattern match can never produce a false "taken".
 */
export async function findPhoneOwners(
  sb: Db,
  phone: string,
): Promise<{ owners: PhoneOwner[] } | { error: string }> {
  const tail = phoneTail(phone);
  if (!tail) return { owners: [] };

  // "%8%0%3%1%2%3%4%5%6%7%": the ten digits in order with anything between them.
  const looseDigits = `%${tail.split("").join("%")}%`;
  const filters = [
    ...phoneLookupVariants(phone).map((v) => `phone.eq.${v}`),
    `phone.ilike.${looseDigits}`,
  ];

  const { data, error } = await sb
    .from("profiles")
    .select("id, email, phone")
    .or(filters.join(","))
    .limit(MAX_CANDIDATES);
  if (error) return { error: error.message };

  const owners = ((data || []) as PhoneOwner[]).filter(
    (row) => phoneTail(row.phone) === tail,
  );
  return { owners };
}
