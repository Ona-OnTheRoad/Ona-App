import { useCallback, useEffect, useRef } from "react";
import { getRuntimeAppConfig } from "@/lib/app-config";
import { backendCreateJob, isAppBackendOnline } from "@/lib/supabase/app-api";
import type { ServiceRequest, Technician } from "@/lib/types";
import { evaluateServiceGate } from "@/lib/verification-gate";
import type { ServiceActionResult } from "./types";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";
import type { ProfilePersistenceResult } from "./use-profile-persistence";

/** Shown when the server did not accept the request and gave no reason. */
export const REQUEST_FAILED_MESSAGE =
  "We couldn't send your request. Please try again.";

export type CreateRequestOptions = {
  /**
   * Called once, with a message fit to show the user, if the server did not accept
   * the request. By then the optimistic request has already been removed from the
   * list, so the UI only has to tell the user. Not called when the account was
   * switched while the request was in flight (the message would be for someone else).
   */
  onFailure?: (message: string) => void;
};

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

  // Who is signed in NOW, read when a response arrives. A booking that finishes
  // after an account switch must not touch the other account's list or profile.
  const identityRef = useRef({ backendUserId, accountType });
  const profileRef = useRef(userProfile);
  useEffect(() => {
    identityRef.current = { backendUserId, accountType };
    profileRef.current = userProfile;
  }, [backendUserId, accountType, userProfile]);

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
      options?: CreateRequestOptions,
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
        const bookedAs = { backendUserId, accountType };
        const sameAccount = () =>
          identityRef.current.backendUserId === bookedAs.backendUserId &&
          identityRef.current.accountType === bookedAs.accountType;

        // The request is shown immediately; if the server refuses it, take it back
        // out and say so. Without this a failed booking stayed "pending" forever.
        const fail = (message: string) => {
          setRequests((prev) => prev.filter((r) => r.id !== localReq.id));
          if (sameAccount()) options?.onFailure?.(message);
        };

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
        })
          .then((res) => {
            if (!res.request) {
              fail(res.error || REQUEST_FAILED_MESSAGE);
              return;
            }
            // Signed in as someone else by now: this booking is not theirs to see.
            if (!sameAccount()) return;
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
          })
          .catch((e: unknown) => {
            fail(e instanceof Error && e.message ? e.message : REQUEST_FAILED_MESSAGE);
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
      options?: CreateRequestOptions,
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
      const hadFirstServiceAt = Boolean(userProfile?.firstServiceAt);
      const req = createRequest(tech, problem, pricing, {
        onFailure: (message) => {
          // The booking never happened, so it must not use up a free-trial request.
          // Relative to the count recorded when this booking started, so it is right
          // whether or not React has re-rendered with the increment yet, and it keeps
          // the count of any other booking made in the meantime.
          const latest = profileRef.current;
          if (latest) {
            const refunded = Math.max(count, (latest.serviceActionCount ?? count + 1) - 1);
            persistProfile({
              ...latest,
              serviceActionCount: refunded,
              firstServiceAt:
                hadFirstServiceAt || refunded > count ? latest.firstServiceAt : undefined,
            });
          }
          options?.onFailure?.(message);
        },
      });
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
