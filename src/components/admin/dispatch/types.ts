export type Cooldown = { proId: string; proName: string; until: string | null };

export type DispatchJob = {
  id: string;
  flowStatus: string;
  serviceType: string;
  problem: string;
  createdAt: string;
  updatedAt: string;
  motoristId: string;
  motoristName: string;
  proId: string;
  proName: string;
  searchingSince: string | null;
  searchEndsAt: string | null;
  negotiateEndsAt: string | null;
  pairingStage: string | null;
  pairingDeadline: string | null;
  pairingRadiusKm: number | null;
  queuePosition: number | null;
  remainingCandidates: number | null;
  reservationStatus: string | null;
  assignmentStatus: string | null;
  chosenProId: string | null;
  chosenProName: string | null;
  meritScore: number | null;
  activeDeferrals: Cooldown[];
  activeExclusions: Cooldown[];
  historySummary: string[];
};

export type Summary = {
  searching: number;
  negotiating: number;
  agreed: number;
  pairing: number;
  activeDeferrals: number;
  activeExclusions: number;
  crossJobExclusions: number;
};
