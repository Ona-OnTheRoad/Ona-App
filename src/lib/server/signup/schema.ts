import "server-only";
import { z } from "zod";

/**
 * Public signup via service role.
 *
 * Why this exists (permanent fix):
 * - Browser `auth.signUp` sends confirmation emails → Supabase free-tier rate
 * limit → "For security purposes, you can only request this after X seconds"
 * - Unconfirmed users often have no session → RLS blocks profile writes
 * - Admin createUser with email_confirm:true creates the account without
 * sending email and allows immediate sign-in.
 */
export const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(32),
  accountType: z.enum(["motorist", "professional"]),
  /** Required for new signups */
  gender: z.enum(["male", "female", "prefer_not_to_say"]),
  /** ISO date YYYY-MM-DD */
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date of birth"),
  city: z.string().optional(),
  area: z.string().optional(),
  businessName: z.string().optional(),
  primaryService: z.string().optional(),
  services: z.array(z.string()).optional(),
  bio: z.string().optional(),
  yearsExperience: z.string().optional(),
  serviceRadiusKm: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  plateNumber: z.string().optional(),
  vehiclePhoto: z.string().optional(),
  vehicleCommonIssues: z.array(z.string()).optional(),
  vehicles: z
    .array(
      z.object({
        id: z.string(),
        make: z.string(),
        model: z.string(),
        year: z.string().optional(),
        plate: z.string().optional(),
        photo: z.string().optional(),
        commonIssues: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  avatarUrl: z.string().optional(),
  nin: z.string().optional(),
  bvn: z.string().optional(),
  /** Labour prices: skill → major units */
  labourPrices: z
    .record(z.string(), z.union([z.number(), z.string()]))
    .optional(),
  pricingCurrency: z
    .enum(["NGN", "USD", "GBP", "ZAR", "EUR", "GHS", "KES", "CAD", "AUD"])
    .optional(),
  /** Service focus (vehicles they fix) */
  vehicleFocus: z.record(z.string(), z.unknown()).optional(),
  skillAnswers: z.record(z.string(), z.unknown()).optional(),
  servedVehicleType: z.string().optional(),
  servedBrand: z.string().optional(),
  servedModel: z.string().optional(),
  servedCountry: z.string().optional(),
  servedLocation: z.string().optional(),
  emergencyContact: z
    .object({ name: z.string(), phone: z.string() })
    .optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankCode: z.string().optional(),
  /** Dual signup: keep the other role's side table */
  keepOtherRole: z.boolean().optional().default(true),
  /** Repair Pro guarantor */
  guarantor: z
    .object({
      fullName: z.string().min(2),
      phone: z.string().min(7),
      address: z.string().optional(),
      occupation: z.string().optional(),
      relationship: z.string().min(2),
    })
    .optional(),
  /** Certification docs review (pros) */
  docsStatus: z
    .enum(["none", "under_review", "approved", "rejected"])
    .optional(),
  certificationFileName: z.string().optional(),
  certificationFileDataUrl: z.string().optional(),
  /** Referral code from ?ref= param in signup link */
  refCode: z.string().max(30).optional(),
  /**
   * Proof from /api/auth/otp/signup/verify that this phone received an SMS code.
   * Optional and best-effort: an invalid/expired/other-number proof is ignored
   * (the account is simply created unverified), never an error.
   */
  phoneProof: z.string().max(600).optional(),
  /**
   * When the user is already logged in (dual-role attach from menu),
   * pass their access_token so we extend THIS identity never create a
   * second auth user (fraud / duplicate account prevention).
   */
  access_token: z.string().min(10).optional(),
});

export type SignupInput = z.infer<typeof bodySchema>;
