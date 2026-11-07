import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_PHONE_DIAL,
  DEFAULT_PHONE_ISO,
  getPhoneCodeOptions,
  splitStoredPhone,
} from "@/lib/phone-codes";
import { getCountryIdPack } from "@/lib/country-id-rules";
import { getVaultProfile } from "@/lib/profiles-vault";
import type { SignupGender } from "@/lib/signup-validation";
import { loadSignupDraft } from "@/lib/signup-draft";
import { useApp } from "@/lib/store";
import { composeFullName } from "./name-utils";

/** Account + service-area form state, including the Repair Pro prefill/lock effect. */
export function useMotoristFields() {
  const { userProfile, isAuthenticated } = useApp();
  const phoneCodes = useMemo(() => getPhoneCodeOptions(), []);
  const searchParams = useSearchParams();
  const urlRef = searchParams.get("ref") || "";
  const fromMenu = searchParams.get("from") === "menu";
  const fromProfile = searchParams.get("from") === "profile";
  const [refInput, setRefInput] = useState(urlRef);
  /** Per-field errors shown on blur when leaving a field */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<SignupGender | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneIso, setPhoneIso] = useState(DEFAULT_PHONE_ISO);
  const idPack = useMemo(() => getCountryIdPack(phoneIso), [phoneIso]);
  const primaryDoc = useMemo(
    () =>
      idPack.docs.find(
        (d) => d.kind === "national_id" && d.requiredForVerify,
      ) ||
      idPack.docs.find((d) => d.requiredForVerify) ||
      idPack.docs[0],
    [idPack],
  );
  const bankDoc = useMemo(
    () => idPack.docs.find((d) => d.kind === "bank_id"),
    [idPack],
  );
  const [phoneDial, setPhoneDial] = useState(DEFAULT_PHONE_DIAL);
  const [phoneNational, setPhoneNational] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [bvn, setBvn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("Lagos");
  const [area, setArea] = useState("");
  /**
   * Dual-role signup: prefill from Repair Pro, but only dim/lock fields
   * that already have values. Empty NIN/BVN stay fully editable (not dimmed).
   */
  const [dualSignup, setDualSignup] = useState(false);
  const [nameLocked, setNameLocked] = useState(false);
  const [genderLocked, setGenderLocked] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [ninLocked, setNinLocked] = useState(false);
  const [bvnLocked, setBvnLocked] = useState(false);

  // Shared "Create account" draft (sessionStorage; no password). Runs before the
  // dual-signup prefill below so locked profile values still win.
  useEffect(() => {
    const d = loadSignupDraft();
    if (!d) return;
    setFullName(composeFullName(d.firstName, d.lastName));
    setEmail(d.email);
    if (d.phoneIso) setPhoneIso(d.phoneIso);
    if (d.phoneDial) setPhoneDial(d.phoneDial);
    setPhoneNational(d.phoneNational);
    setGender(d.gender);
    setDateOfBirth(d.dateOfBirth);
    setIdNumber(d.idNumber);
    setBvn(d.bvn);
    if (!urlRef && d.referral) setRefInput(d.referral);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from existing Repair Pro lock only fields that already have values
  useEffect(() => {
    const dualRole = fromMenu || fromProfile;
    if (!dualRole || !isAuthenticated) {
      setDualSignup(false);
      setNameLocked(false);
      setGenderLocked(false);
      setPhoneLocked(false);
      setEmailLocked(false);
      setNinLocked(false);
      setBvnLocked(false);
      return;
    }
    const vaultPro = getVaultProfile("professional");
    const livePro =
      userProfile?.accountType === "professional" ? userProfile : null;
    // Dual signup from menu: any authenticated non-customer session is the source
    const sessionSource =
      isAuthenticated && userProfile && userProfile.accountType !== "motorist"
        ? userProfile
        : null;
    const pro = livePro || sessionSource || vaultPro;
    if (!pro) {
      setDualSignup(false);
      setNameLocked(false);
      setGenderLocked(false);
      // Do not touch dateOfBirth stays empty until the customer picks it.
      // Clearing here would wipe a DOB the user already chose if this effect re-runs.
      setPhoneLocked(false);
      setEmailLocked(false);
      setNinLocked(false);
      setBvnLocked(false);
      return;
    }

    setDualSignup(true);

    const name = (pro.fullName || vaultPro?.fullName || "").trim();
    const em = (pro.email || vaultPro?.email || "").trim();
    const nin = (pro.idNumber || vaultPro?.idNumber || "").trim();
    const bankId = (pro.bvn || vaultPro?.bvn || "").trim();
    const phoneRaw = (pro.phone || vaultPro?.phone || "").trim();
    const g = (pro.gender || vaultPro?.gender || "") as SignupGender | "";

    if (name) {
      setFullName(name);
      setNameLocked(true);
    } else {
      setNameLocked(false);
    }
    if (g === "male" || g === "female" || g === "prefer_not_to_say") {
      setGender(g);
      setGenderLocked(true);
    } else {
      setGenderLocked(false);
    }
    // Customer DOB: never pre-fill from Repair Pro / vault (initial state is "").
    // Intentionally do not call setDateOfBirth re-runs must not wipe user input.
    if (em) {
      setEmail(em);
      setEmailLocked(true);
    } else {
      setEmailLocked(false);
    }
    // NIN/BVN: only lock + dim when a full 11-digit value exists.
    // Empty / never-filled / last4-only → stay fully editable (not dimmed).
    const ninDigits = nin.replace(/\D/g, "");
    const bvnDigits = bankId.replace(/\D/g, "");
    if (ninDigits.length === 11) {
      setIdNumber(ninDigits);
      setNinLocked(true);
    } else {
      setIdNumber("");
      setNinLocked(false);
    }
    if (bvnDigits.length === 11) {
      setBvn(bvnDigits);
      setBvnLocked(true);
    } else {
      setBvn("");
      setBvnLocked(false);
    }

    setCity(pro.city || vaultPro?.city || "Lagos");
    setArea(pro.area || vaultPro?.area || "");
    // Prefill same password if we still have it locally (user can edit)
    const pwd = (vaultPro?.password || pro.password || "").trim();
    if (pwd) {
      setPassword(pwd);
      setConfirmPassword(pwd);
    }
    if (phoneRaw) {
      const split = splitStoredPhone(phoneRaw);
      setPhoneIso(split.iso);
      setPhoneDial(split.dial);
      setPhoneNational(split.national);
      setPhoneLocked(true);
    } else {
      setPhoneLocked(false);
    }
  }, [userProfile, isAuthenticated]);

  const setFieldError = (key: string, msg: string | null) => {
    setFieldErrors((prev) => {
      if (!msg) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: msg };
    });
  };

  return {
    phoneCodes,
    urlRef,
    refInput,
    setRefInput,
    fieldErrors,
    setFieldError,
    fullName,
    setFullName,
    gender,
    setGender,
    dateOfBirth,
    setDateOfBirth,
    phoneIso,
    setPhoneIso,
    idPack,
    primaryDoc,
    bankDoc,
    phoneDial,
    setPhoneDial,
    phoneNational,
    setPhoneNational,
    email,
    setEmail,
    idNumber,
    setIdNumber,
    bvn,
    setBvn,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    city,
    setCity,
    area,
    setArea,
    dualSignup: dualSignup || fromMenu || fromProfile,
    nameLocked,
    genderLocked,
    phoneLocked,
    emailLocked,
    ninLocked,
    bvnLocked,
  };
}

export type MotoristFields = ReturnType<typeof useMotoristFields>;
