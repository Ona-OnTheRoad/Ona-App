import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { checkIdentityAvailable } from "@/lib/account-registry";
import { formatInternationalPhone } from "@/lib/phone-codes";
import { verifySignupIds } from "@/lib/ng-id-verify-client";
import { normalizeDobIso, type SignupGender } from "@/lib/signup-validation";
import { useApp } from "@/lib/store";
import type { MotoristVehicle, UserProfile } from "@/lib/types";
import {
  isDualPasswordOk,
  isStep1Ok,
  isStep2Ok,
  validateStep1 as validateAccount,
  type AccountValues,
} from "./motorist-validation";
import type { Step } from "./types";
import { useMotoristFields } from "./use-motorist-fields";
import { useMotoristVehicles } from "./use-motorist-vehicles";

/**
 * Full Customer signup polished account step + reduced corner radius.
 * Menu dual-signup: locks identity from Repair Pro, lands on Motorist home.
 */
export function useMotoristSignup() {
  const router = useRouter();
  const { exiting, go } = useAuthNavigate();
  const searchParams = useSearchParams();
  const { completeSignup, setManualLocation } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const fields = useMotoristFields();
  const vehicleState = useMotoristVehicles();
  const {
    fullName,
    gender,
    dateOfBirth,
    phoneIso,
    phoneDial,
    phoneNational,
    email,
    idNumber,
    bvn,
    password,
    confirmPassword,
    city,
    area,
    dualSignup,
    primaryDoc,
    bankDoc,
  } = fields;
  const {
    vehicles,
    setVehicles,
    draftVehicleType,
    draftMake,
    draftModel,
    draftYear,
    draftReady,
    resetDraft,
  } = vehicleState;

  const fromMenu = searchParams.get("from") === "menu";

  const fullPhone = formatInternationalPhone(phoneDial, phoneNational);

  const accountValues: AccountValues = {
    dualSignup,
    fullName,
    gender,
    dateOfBirth,
    phoneNational,
    email,
    idNumber,
    bvn,
    password,
    confirmPassword,
    primaryDoc,
    bankDoc,
  };
  const dualPasswordOk = isDualPasswordOk(password);
  const step1Ok = isStep1Ok(accountValues);
  const step2Ok = isStep2Ok(city, area);
  const validateStep1 = (): string | null => validateAccount(accountValues);

  const goBack = () => {
    if (step === 1) {
      if (fromMenu) {
        router.replace("/dashboard");
        return;
      }
      go("/login/role");
      return;
    }
    setStep((s) => (s - 1) as Step);
  };

  const guardIdentity = (): string | null => {
    // Dual role (same person): Motorist + Repair Pro share one phone/email/NIN/BVN
    if (dualSignup) return null;
    const check = checkIdentityAvailable({
      phone: fullPhone,
      email: email.trim(),
      nin: idNumber.trim() || undefined,
      bvn: bvn.trim() || undefined,
      accountType: "motorist",
    });
    return check.ok ? null : check.message;
  };

  const finish = async (opts?: { skipVehicle?: boolean }) => {
    if (busy) return;
    const v = validateStep1();
    if (v) {
      setFormError(v);
      setStep(1);
      return;
    }
    if (!step2Ok) {
      setFormError("Enter your city and area.");
      setStep(2);
      return;
    }

    // Skip: register without vehicles. Create account: save draft if filled.
    let list = vehicles;
    if (!opts?.skipVehicle && draftReady) {
      const next: MotoristVehicle = {
        id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        vehicleType: draftVehicleType.trim() || undefined,
        make: draftMake.trim(),
        model: draftModel.trim(),
        year: draftYear.trim() || undefined,
      };
      list = [...vehicles, next];
      setVehicles(list);
      resetDraft();
    }
    if (opts?.skipVehicle) {
      list = [];
      setVehicles([]);
      resetDraft();
    }
    // Vehicles optional empty list is fine for non-car services

    setBusy(true);
    setFormError("");

    const identityErr = guardIdentity();
    if (identityErr) {
      setFormError(identityErr);
      setBusy(false);
      setStep(1);
      return;
    }

    // Live number checks only for countries that support them (e.g. NG NIN/BVN)
    if (
      (primaryDoc?.api === "nin" && idNumber.trim()) ||
      (bankDoc?.api === "bvn" && bvn.trim())
    ) {
      const verified = await verifySignupIds({
        nin:
          primaryDoc?.api === "nin" ? idNumber.trim() || undefined : undefined,
        bvn: bankDoc?.api === "bvn" ? bvn.trim() || undefined : undefined,
        requireBoth: false,
      });
      if (!verified.ok) {
        setFormError(verified.message);
        setBusy(false);
        setStep(1);
        return;
      }
    }

    const first = list[0];
    const profile: UserProfile = {
      accountType: "motorist",
      fullName: fullName.trim(),
      name_locked: true,
      gender: gender as SignupGender,
      dateOfBirth: normalizeDobIso(dateOfBirth) || "",
      phone: fullPhone,
      email: email.trim(),
      password,
      city: city.trim(),
      area: area.trim(),
      idNumber: idNumber.trim() || undefined,
      bvn: bvn.trim() || undefined,
      identityCountryIso: phoneIso,
      govIdKind: primaryDoc?.kind,
      vehicles: list.length ? list : undefined,
      vehicleMake: first?.make,
      vehicleModel: first?.model,
      vehicleYear: first?.year,
      registeredAt: new Date().toISOString(),
      refCode: searchParams.get("ref") || undefined,
    };

    // Service area text → home map session label (Lagos default coords until GPS)
    const areaLabel = [area.trim(), city.trim()].filter(Boolean).join(", ");
    if (areaLabel) {
      setManualLocation(areaLabel, { lat: 6.5244, lng: 3.3792 });
    }
    const err = await completeSignup(profile);
    if (err) {
      setBusy(false);
      // Hard failure page never open homepage without server registration
      router.replace(
        `/signup/error?role=motorist&message=${encodeURIComponent(err)}`,
      );
      return;
    }
    setDone(true);
    setBusy(false);
  };

  /** Footer "Next": validate the current step, then advance. */
  const goNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setFormError(err);
        return;
      }
      const identityErr = guardIdentity();
      if (identityErr) {
        setFormError(identityErr);
        return;
      }
    } else if (!step2Ok) {
      return;
    }
    setFormError("");
    setStep((s) => (s + 1) as Step);
  };

  return {
    exiting,
    router,
    step,
    done,
    busy,
    formError,
    setFormError,
    fields,
    vehicleState,
    dualPasswordOk,
    step1Ok,
    step2Ok,
    goBack,
    goNext,
    finish,
  };
}
