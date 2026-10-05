import type { ArtisanOnboardingStep } from "@/lib/artisan/types";

export const STEPS: { id: ArtisanOnboardingStep; label: string }[] = [
  { id: "trade", label: "Trade" },
  { id: "profession", label: "Skill" },
  { id: "phone", label: "Phone" },
  { id: "essentials", label: "Profile" },
  { id: "portfolio", label: "Portfolio" },
  { id: "video", label: "Video" },
  { id: "optional_tiers", label: "Verify+" },
  { id: "review", label: "Submit" },
];
