import "server-only";
import { z } from "@/lib/server/openapi/zod-extend";

export const jobIdParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .openapi("JobIdParams");

const mediaSchema = z.object({
  id: z.string(),
  kind: z.enum(["photo", "voice", "other"]),
  url: z.string(),
  name: z.string().optional(),
  mime: z.string().optional(),
  durationSec: z.number().optional(),
  createdAt: z.string(),
  uploadedBy: z.string(),
});

export const jobCreateBodySchema = z
  .object({
    motoristId: z.string().min(1),
    motoristName: z.string().min(1),
    motoristPhoto: z.string().optional().nullable(),
    repairProId: z.string().min(1).optional().nullable(),
    repairProName: z.string().optional(),
    repairProPhoto: z.string().optional(),
    serviceType: z.string(),
    problem: z.string().min(3).max(2000),
    emergency: z.boolean().optional(),
    voiceNote: mediaSchema.nullable().optional(),
    photos: z.array(mediaSchema).optional(),
    currency: z
      .enum(["NGN", "USD", "GBP", "ZAR", "EUR", "GHS", "KES", "CAD", "AUD"])
      .optional()
      .default("NGN"),
    proBaseMajor: z.number().positive().nullable().optional(),
    locationLabel: z.string().optional().default("Near you"),
    lat: z.number(),
    lng: z.number(),
    motoristVehicle: z.string().max(200).optional().nullable(),
    radiusKm: z.number().min(0).max(100).optional().nullable(),
    clientRequestId: z.string().min(1).max(100).optional().nullable(),
    atWorkshop: z.boolean().optional(),
    remoteConsultation: z.boolean().optional(),
    physicalAttendanceRequired: z.boolean().optional(),
    calloutEligible: z.boolean().optional(),
    calloutUrgency: z.enum(["normal", "emergency", "remote", "night"]).optional(),
    meetPro: z.boolean().optional(),
    meetProTrade: z.string().optional().nullable(),
  })
  .openapi("JobCreateBody");

export const jobTransitionBodySchema = z
  .object({
    event: z.string().min(1),
    actorId: z.string().optional(),
    actorRole: z.string().optional(),
  })
  .passthrough()
  .openapi("JobTransitionBody");

export const jobOfferBodySchema = z
  .object({
    action: z.enum(["place", "accept"]),
    side: z.enum(["repair_pro", "motorist"]),
    actorId: z.string().min(1),
    amountMajor: z.number().int().min(1).max(999_999).optional(),
    clientOfferId: z.string().min(1).max(100).optional().nullable(),
  })
  .openapi("JobOfferBody");

export const jobPayBodySchema = z
  .object({
    motoristId: z.string().min(1).optional(),
    email: z.string().optional(),
    customerName: z.string().max(120).optional(),
    customerPhone: z.string().max(32).optional(),
    provider: z.enum(["mock", "paystack", "flutterwave"]).optional(),
    returnOrigin: z.string().url().optional(),
    preferInline: z.boolean().optional(),
    action: z.enum(["start", "cancel"]).optional(),
  })
  .openapi("JobPayBody");

export const jobLocationBodySchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    actor: z.enum(["motorist", "repair_pro"]).optional().default("repair_pro"),
    actorId: z.string().optional(),
  })
  .openapi("JobLocationBody");

export const jobRateBodySchema = z
  .object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(2000).optional(),
  })
  .openapi("JobRateBody");

export const jobDisputeBodySchema = z
  .object({
    action: z.enum(["open", "resolve"]).optional(),
    reason: z.string().optional(),
  })
  .passthrough()
  .openapi("JobDisputeBody");
