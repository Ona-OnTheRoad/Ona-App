export type WalletData = {
  totalEarned: number;
  pendingCredits: number;
  availableCredits: number;
  redeemedCredits: number;
  cashableCredits: number;
  serviceSpendCredits: number;
  reversedCredits: number;
  blockedCredits: number;
};

export type ReferralData = {
  code: { referralCode: string; referralLink: string };
  events: {
    id: string;
    status: string;
    rewardAmount: number;
    createdAt: string;
  }[];
};

export type TxData = {
  id: string;
  transactionType: string;
  amount: number;
  status: string;
  reason?: string;
  createdAt: string;
}[];

export const WALLET_ACCENT = "#FF6B35";
