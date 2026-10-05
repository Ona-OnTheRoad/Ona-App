"use client";

import { useEffect, useState } from "react";

/** Supabase access token for the signed-in user (empty until resolved). */
export function useAccessToken(): string {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { getAppSupabase } = await import("@/lib/supabase/app-client");
        const sb = getAppSupabase();
        const s = sb ? (await sb.auth.getSession()).data.session : null;
        if (s?.access_token) setAccessToken(s.access_token);
      } catch {
        /* */
      }
    })();
  }, []);

  return accessToken;
}
