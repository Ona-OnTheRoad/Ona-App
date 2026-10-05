import type { ProService } from "@/lib/types";

export type CalloutPolicyAdmin = {
  enabled: boolean;
  ratePerKm: number;
  minimumBillableDistanceKm: number;
  maximumRadiusKm: number;
  billingIncrementKm: number;
};

export type CalloutTradeAdmin = {
  tradeId: ProService;
  baseFee: number;
  enabled: boolean;
};
