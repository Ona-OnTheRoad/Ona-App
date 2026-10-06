import { useCallback } from "react";
import { getRuntimeAppConfig } from "@/lib/app-config";
import { backendCreateJob, isAppBackendOnline } from "@/lib/supabase/app-api";
import type { ServiceRequest, Technician } from "@/lib/types";
import { evaluateServiceGate } from "@/lib/verification-gate";
import type { ServiceActionResult } from "./types";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { ProfilePersistenceResult } from "./use-profile-persistence";

export function useRequests(
  session: SessionStateResult,
  market: MarketStateResult,
  profileApi: ProfilePersistenceResult,
) {
  const {
    displayName,
    accountType,
    userProfile,
    helpingSomeoneElse,
    backendUserId,
  } = session;
  const { location, radiusKm, setRequests } = market;
  const { persistProfile } = profileApi;

  const createRequest = useCallback(
    (
      tech: Technician,
      problem = "Roadside assistance",
      pricing?: {
        labourBaseMajor: number;
        labourAgreedMajor: number;
        discountPercent: number;
        pricingCurrency: import("@/lib/pricing").AppCurrency;
        negotiationStatus?: ServiceRequest["negotiationStatus"];
      },
    ) => {
      const forSomeone = helpingSomeoneElse;
      // Always store full address for jobs + maps (street + area)
      const meetLabel = (() => {
        const full = (location.label || "").trim();
        const city = (location.city || "").trim();
        if (
          full &&
          full !== "Current location" &&
          full !== "Locating…" &&
          full !== "Locating..."
        ) {
          // If label already includes city, use as-is; else append city
          if (city && !full.toLowerCase().includes(city.toLowerCase())) {
            return `${full}, ${city}`;
          }
          return full;
        }
        if (city) return city;
        return "Near you";
      })();
      const desc = forSomeone
        ? `[Booking for someone else · meet: ${meetLabel}] ${problem}`
        : problem;
      const localReq: ServiceRequest = {
        id: `r-${Date.now()}`,
        technicianId: tech.id,
        technicianName: tech.name,
        serviceType: tech.serviceType,
        problem: desc,
        status: "pending",
        createdAt: new Date().toISOString(),
        etaMinutes: tech.etaMinutes,
        distanceKm: tech.distanceKm,
        locationLabel: meetLabel,
        bookingForSomeoneElse: forSomeone || undefined,
        meetCoordinates: forSomeone ? { ...location.coordinates } : undefined,
        labourBaseMajor: pricing?.labourBaseMajor,
        labourAgreedMajor: pricing?.labourAgreedMajor,
        discountPercent: pricing?.discountPercent,
        pricingCurrency: pricing?.pricingCurrency,
        negotiationStatus: pricing?.negotiationStatus ?? "none",
      };

      if (isAppBackendOnline() && backendUserId && accountType === "motorist") {
        // Full premium create: flow_status=negotiating + DB notify to pro
        void backendCreateJob({
          motoristId: backendUserId,
          repairProId: tech.id,
          serviceType: tech.serviceType,
          description: desc,
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
          address: meetLabel,
          radiusKm,
          motoristName: displayName || "Customer",
          repairProName: tech.name,
          repairProPhoto: tech.photo,
          proBaseMajor: pricing?.labourBaseMajor ?? null,
          currency: pricing?.pricingCurrency || "NGN",
        }).then((res) => {
          if (res.request) {
            const cloud: ServiceRequest = {
              ...res.request,
              bookingForSomeoneElse: forSomeone || undefined,
              meetCoordinates: forSomeone
                ? { ...location.coordinates }
                : undefined,
              locationLabel: meetLabel,
              labourBaseMajor:
                res.request.labourBaseMajor ?? pricing?.labourBaseMajor,
              labourAgreedMajor:
                res.request.labourAgreedMajor ?? pricing?.labourAgreedMajor,
              pricingCurrency:
                res.request.pricingCurrency ?? pricing?.pricingCurrency,
            };
            setRequests((prev) => [
              cloud,
              ...prev.filter((r) => r.id !== localReq.id),
            ]);
          }
        });
      }

      setRequests((prev) => [localReq, ...prev]);
      return localReq;
    },
    [
      helpingSomeoneElse,
      location.label,
      location.coordinates.lat,
      location.coordinates.lng,
      backendUserId,
      accountType,
      radiusKm,
      displayName,
      setRequests,
    ],
  );

  const bookRequest = useCallback(
    (
      tech: Technician,
      problem = "Roadside assistance",
      pricing?: {
        labourBaseMajor: number;
        labourAgreedMajor: number;
        discountPercent: number;
        pricingCurrency: import("@/lib/pricing").AppCurrency;
        negotiationStatus?: ServiceRequest["negotiationStatus"];
      },
    ): ServiceActionResult => {
      const cfg = getRuntimeAppConfig();
      const gate = cfg.features.identityVerifyEnabled
        ? evaluateServiceGate(userProfile, "motorist", {
            trialDays: cfg.verification.trialDays ?? 30,
            warnFrom: cfg.verification.warnFrom,
            blockAt: cfg.verification.blockAt,
          })
        : {
            allowed: true as const,
            warning: null,
            nextIndex: 0,
            remaining: Infinity,
          };
      const count = userProfile?.serviceActionCount ?? 0;
      if (!gate.allowed) {
        return {
          ok: false,
          code: "verification_required",
          message: gate.message,
          actionCount: count,
        };
      }
      // Labour price required before request / escrow (Quote on request blocks)
      if (
        pricing == null ||
        !Number.isFinite(pricing.labourBaseMajor) ||
        pricing.labourBaseMajor <= 0
      ) {
        return {
          ok: false,
          code: "invalid",
          message:
            "This Repair Pro has no labour price set. Quote on request they must set a price on their profile first.",
          actionCount: count,
        };
      }
      const req = createRequest(tech, problem, pricing);
      if (userProfile) {
        const nowIso = new Date().toISOString();
        persistProfile({
          ...userProfile,
          serviceActionCount: count + 1,
          // Start 30-day free window on first request
          firstServiceAt: userProfile.firstServiceAt || nowIso,
        });
      }
      return {
        ok: true,
        request: req,
        warning: gate.warning,
        actionCount: count + 1,
      };
    },
    [userProfile, createRequest, persistProfile],
  );
  return {
    createRequest,
    bookRequest,
  };
}

export type RequestsResult = ReturnType<typeof useRequests>;
