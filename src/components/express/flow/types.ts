export type Stage =
  | "blocked"
  | "categories"
  | "vehicle"
  | "questions"
  | "detected"
  | "booking"
  | "location"
  | "urgency"
  | "pay"
  | "paying"
  | "assigned";

export type ResumePayload = {
  requestId: string;
  trade: string;
  lat: number;
  lng: number;
  label: string;
};

export type Quote = {
  trade: string;
  baseMajor: number;
  baseChargeMajor: number;
  distanceKm: number | null;
  distanceChargeMajor: number;
  calloutMajor: number;
  urgency: string;
  urgencyMultiplier: number;
  urgencySurchargeMajor: number;
  totalMajor: number;
};

export type BankPay = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  amountMajor: number;
  reference: string;
  sessionEndsAt: string;
};

export type AssignedPro = {
  name: string;
  trade: string;
  requestId: string;
};

export type BookingType = "instant" | "scheduled";

/** Theme-derived class tokens shared by every Express step view. */
export type ExpressTheme = {
  isLight: boolean;
  ink: string;
  muted: string;
  rowCard: string;
  field: string;
};
