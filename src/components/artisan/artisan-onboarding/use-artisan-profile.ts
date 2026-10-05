import { useMemo } from "react";
import { getArtisanProfile } from "@/lib/artisan/local-store";

export function useArtisanProfile(userId: string | null) {
  return useMemo(() => {
    if (!userId) return null;
    return getArtisanProfile(userId);
  }, [userId]);
}
