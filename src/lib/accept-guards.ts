import { getRuntimeAppConfig } from "@/lib/app-config";
import { isProService } from "@/lib/pro-service-id";
import type {
  ProService,
  RegisteredAs,
  ServiceRequest,
  UserProfile,
} from "@/lib/types";
import { evaluateServiceGate } from "@/lib/verification-gate";

export type AcceptBlock = {
  code: "skill_mismatch" | "verification_required";
  message: string;
};

/** Skill lock: a mechanic cannot take a vulcanizer job, etc. */
export function skillLockBlock(input: {
  request: ServiceRequest;
  registeredAs: RegisteredAs;
  proServices: ProService[];
}): AcceptBlock | null {
  const mySkill: ProService | null = isProService(input.registeredAs)
    ? input.registeredAs
    : (input.proServices[0] ?? null);
  if (mySkill && input.request.serviceType !== mySkill) {
    return {
      code: "skill_mismatch",
      message: `This job is for ${input.request.serviceType}. Your skill is ${mySkill} only you cannot take another trade's job.`,
    };
  }
  return null;
}

/** Progressive verification gate: only "accept" is gated, progress stays free. */
export function verificationGate(input: {
  profile: UserProfile | null;
  isProfessional: boolean;
}):
  | { allowed: true; warning: string | null }
  | { allowed: false; message: string } {
  const cfg = getRuntimeAppConfig();
  if (!cfg.features.identityVerifyEnabled) {
    return { allowed: true, warning: null };
  }
  const gate = evaluateServiceGate(
    input.profile,
    input.isProfessional ? "professional" : input.profile?.accountType,
    {
      trialDays: cfg.verification.trialDays ?? 30,
      warnFrom: cfg.verification.warnFrom,
      blockAt: cfg.verification.blockAt,
    },
  );
  return gate.allowed
    ? { allowed: true, warning: gate.warning }
    : { allowed: false, message: gate.message };
}
