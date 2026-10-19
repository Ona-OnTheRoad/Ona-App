"use client";

import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  filterIdInput,
  getCountryIdPack,
  type CountryIdDoc,
  validateIdFormat,
} from "@/lib/country-id-rules";
import { splitStoredPhone } from "@/lib/phone-codes";
import { useApp } from "@/lib/store";
import { backendLoadUserProfile } from "@/lib/supabase/app-api";
import {
  CUSTOMER_PHONE_OTP,
  customerTierLabel,
  getFirstServiceAt,
  isIdentityPending,
  isIdentityVerified,
  isPhoneVerified,
  remainingFreeActions,
} from "@/lib/verification-gate";

/** State, effects and handlers for the customer verification page. */
export function useVerifyIdentity() {
  const router = useRouter();
  const {
    isAuthenticated,
    userProfile,
    accountType,
    backendUserId,
    completeIdentityVerification,
    verifyCustomerPhoneOtp,
    updateUserProfile,
  } = useApp();
  const countryIso = useMemo(() => {
    if (userProfile?.identityCountryIso) {
      return userProfile.identityCountryIso.toUpperCase();
    }
    if (userProfile?.phone) {
      return splitStoredPhone(userProfile.phone).iso.toUpperCase();
    }
    return "NG";
  }, [userProfile]);

  const pack = useMemo(() => getCountryIdPack(countryIso), [countryIso]);
  /** Primary ID types for this country (exclude bank-only as standalone pick) */
  const idTypes = useMemo(
    () =>
      pack.docs.filter(
        (d) => d.kind !== "bank_id" && (d.requiredForVerify || d.needsFront),
      ),
    [pack],
  );
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string | null>(null);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFront, setIdFront] = useState("");
  const [idFrontName, setIdFrontName] = useState("");
  const [idBack, setIdBack] = useState("");
  const [idBackName, setIdBackName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useFeedbackToast("", error);
  const [submitted, setSubmitted] = useState(false);

  const phoneOk = isPhoneVerified(userProfile);
  const tier2Ok = isIdentityVerified(userProfile);
  const pending = isIdentityPending(userProfile);
  const daysLeft = remainingFreeActions(userProfile);
  const tier = customerTierLabel(userProfile);
  const trialStarted = Boolean(getFirstServiceAt(userProfile));

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (accountType === "professional") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, accountType, router]);

  useEffect(() => {
    setSubmitted(pending || tier2Ok);
    if (userProfile?.idNumber) setIdNumber(userProfile.idNumber);
    if (userProfile?.govIdKind) setIdType(userProfile.govIdKind);
    if (userProfile?.govIdFrontUrl) setIdFront(userProfile.govIdFrontUrl);
    if (userProfile?.govIdBackUrl) setIdBack(userProfile.govIdBackUrl);
  }, [userProfile, pending, tier2Ok]);

  const selectedDoc: CountryIdDoc | undefined = useMemo(
    () => idTypes.find((d) => d.kind === idType) || idTypes[0],
    [idTypes, idType],
  );

  useEffect(() => {
    if (!idType && idTypes[0]) setIdType(idTypes[0].kind);
  }, [idTypes, idType]);

  // Poll server while ID is in review flip to approved immediately
  useEffect(() => {
    if (!pending || tier2Ok || !backendUserId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await backendLoadUserProfile(backendUserId);
        if (cancelled || !p) return;
        if (
          p.identityReviewStatus === "approved" ||
          p.govIdVerified ||
          p.identityVerifiedAt
        ) {
          updateUserProfile({
            identityReviewStatus: "approved",
            govIdVerified: true,
            ninVerified: true,
            identityVerifiedAt:
              p.identityVerifiedAt || new Date().toISOString(),
            idNumber: p.idNumber || userProfile?.idNumber,
            govIdKind: p.govIdKind || userProfile?.govIdKind,
          });
          setSubmitted(true);
        } else if (p.identityReviewStatus === "rejected") {
          updateUserProfile({
            identityReviewStatus: "rejected",
            govIdVerified: false,
          });
          setSubmitted(false);
        }
      } catch {
        /* offline */
      }
    };
    void tick();
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void tick();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    pending,
    tier2Ok,
    backendUserId,
    updateUserProfile,
    userProfile?.idNumber,
    userProfile?.govIdKind,
  ]);

  const sendDemoOtp = () => {
    setOtpMsg(`Code sent. For now enter ${CUSTOMER_PHONE_OTP} (demo OTP).`);
    setError("");
  };

  const confirmPhone = async () => {
    setOtpBusy(true);
    setError("");
    try {
      const err = await verifyCustomerPhoneOtp(otp);
      if (err) {
        setError(err);
        return;
      }
      setOtpMsg("Phone verified · Tier 1 complete.");
      setOtp("");
    } finally {
      setOtpBusy(false);
    }
  };

  const submitId = async () => {
    if (busy) return;
    setError("");
    if (!phoneOk) {
      setError("Complete phone verification (Tier 1) first.");
      return;
    }
    const doc = selectedDoc;
    if (!doc) {
      setError("Pick an ID type for your country.");
      return;
    }
    const val = filterIdInput(idNumber, doc);
    const fmt = validateIdFormat(val, doc);
    if (!fmt.ok) {
      setError(fmt.message);
      return;
    }
    if (doc.needsFront && !idFront) {
      setError(
        doc.needsBack
          ? `Upload a clear front photo of your ${doc.label}.`
          : `Upload a clear photo of your ${doc.label}.`,
      );
      return;
    }
    if (doc.needsBack && !idBack) {
      setError(`Upload a clear back photo of your ${doc.label}.`);
      return;
    }
    // T2 = government ID only (BVN moved to Tier 3)
    setBusy(true);
    try {
      const err = await completeIdentityVerification({
        primaryId: val,
        nin: doc.api === "nin" ? val : undefined,
        countryIso,
        govIdKind: doc.kind,
        govIdFrontUrl: idFront || undefined,
        govIdBackUrl: doc.needsBack ? idBack || undefined : undefined,
        mode: "submit",
      });
      if (err) {
        setError(err);
        return;
      }
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  const pickIdFront = (dataUrl: string, name: string) => {
    setIdFront(dataUrl);
    setIdFrontName(name);
    setError("");
  };

  const pickIdBack = (dataUrl: string, name: string) => {
    setIdBack(dataUrl);
    setIdBackName(name);
    setError("");
  };

  const onPhotoReadError = () => setError("Could not read photo.");

  const changeIdType = (kind: string) => {
    setIdType(kind);
    setIdNumber("");
    setIdFront("");
    setIdFrontName("");
    setIdBack("");
    setIdBackName("");
  };

  return {
    userProfile,
    accountType,
    countryIso,
    pack,
    idTypes,
    otp,
    setOtp,
    otpBusy,
    otpMsg,
    idType,
    idNumber,
    setIdNumber,
    idFront,
    idFrontName,
    idBack,
    idBackName,
    busy,
    error,
    submitted,
    phoneOk,
    tier2Ok,
    daysLeft,
    tier,
    trialStarted,
    selectedDoc,
    sendDemoOtp,
    confirmPhone,
    submitId,
    pickIdFront,
    pickIdBack,
    onPhotoReadError,
    changeIdType,
  };
}
