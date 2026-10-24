import { authFetch } from "@/lib/api-auth-headers";

/** Checks the signed-in user's password. Returns null when it matches, else a message. */
export async function verifyAccountPassword(
  password: string,
): Promise<string | null> {
  try {
    const res = await authFetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: { message?: string };
    } | null;
    if (json?.ok) return null;
    return json?.error?.message || "Could not check your password. Try again.";
  } catch {
    return "Network error. Check your connection and try again.";
  }
}
