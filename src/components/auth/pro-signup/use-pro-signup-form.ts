import { useEffect, useState } from "react";
import {
  DEFAULT_PHONE_DIAL,
  DEFAULT_PHONE_ISO,
  formatInternationalPhone,
  splitStoredPhone,
} from "@/lib/phone-codes";
import { getVaultProfile } from "@/lib/profiles-vault";
import type { SignupGender } from "@/lib/signup-validation";
import type { UserProfile } from "@/lib/types";

type FormArgs = {
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  fromMenu: boolean;
  fromProfile: boolean;
};

/**
 * Personal / contact / guarantor / area field state, the Customer-prefill
 * locks (dual-role signup) and per-field errors.
 */
export function useProSignupForm({
  userProfile,
  isAuthenticated,
  fromMenu,
  fromProfile,
}: FormArgs) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /**
   * Dual-role signup: prefill from Customer, but only dim/lock fields
   * that already have values. Empty NIN/BVN stay fully editable (not dimmed).
   */
  const [dualSignup, setDualSignup] = useState(false);
  const [nameLocked, setNameLocked] = useState(false);
  const [genderLocked, setGenderLocked] = useState(false);
  const [dobLocked, setDobLocked] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [ninLocked, setNinLocked] = useState(false);
  const [bvnLocked, setBvnLocked] = useState(false);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<SignupGender | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [phoneIso, setPhoneIso] = useState(DEFAULT_PHONE_ISO);
  const [phoneDial, setPhoneDial] = useState(DEFAULT_PHONE_DIAL);
  const [phoneNational, setPhoneNational] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [bvn, setBvn] = useState("");

  // Guarantor (compulsory for Repair Pro)
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");
  const [guarantorOccupation, setGuarantorOccupation] = useState("");
  const [guarantorRelationship, setGuarantorRelationship] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("Lagos");
  const [area, setArea] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(5);

  const fullPhone = formatInternationalPhone(phoneDial, phoneNational);

  /**
   * Prefill from existing Customer lock only fields that already have values.
   * Empty NIN/BVN are never dimmed.
   */
  useEffect(() => {
    const dualRole = fromMenu || fromProfile;
    if (!dualRole || !isAuthenticated) {
      setDualSignup(false);
      setNameLocked(false);
      setGenderLocked(false);
      setDobLocked(false);
      setPhoneLocked(false);
      setEmailLocked(false);
      setNinLocked(false);
      setBvnLocked(false);
      return;
    }
    const vaultMot = getVaultProfile("motorist");
    const liveMot =
      userProfile?.accountType === "motorist" ? userProfile : null;
    const sessionSource =
      userProfile && userProfile.accountType !== "professional"
        ? userProfile
        : null;
    const motorist = liveMot || sessionSource || vaultMot;
    if (!motorist) {
      setDualSignup(false);
      setNameLocked(false);
      setGenderLocked(false);
      setDobLocked(false);
      setPhoneLocked(false);
      setEmailLocked(false);
      setNinLocked(false);
      setBvnLocked(false);
      return;
    }

    setDualSignup(true);

    const name = (motorist.fullName || vaultMot?.fullName || "").trim();
    const em = (motorist.email || vaultMot?.email || "").trim();
    const nin = (motorist.idNumber || vaultMot?.idNumber || "").trim();
    const bankId = (motorist.bvn || vaultMot?.bvn || "").trim();
    const phoneRaw = (motorist.phone || vaultMot?.phone || "").trim();
    const g = (motorist.gender || vaultMot?.gender || "") as SignupGender | "";
    const dob = (motorist.dateOfBirth || vaultMot?.dateOfBirth || "").slice(
      0,
      10,
    );

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
    if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setDateOfBirth(dob);
      setDobLocked(true);
    } else {
      setDobLocked(false);
    }
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

    setCity(motorist.city || vaultMot?.city || "Lagos");
    setArea(motorist.area || vaultMot?.area || "");
    const pwd = (vaultMot?.password || motorist.password || "").trim();
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
  }, [userProfile, isAuthenticated, fromMenu, fromProfile]);

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
    fieldErrors,
    setFieldError,
    dualSignup,
    nameLocked,
    genderLocked,
    dobLocked,
    phoneLocked,
    emailLocked,
    ninLocked,
    bvnLocked,
    fullName,
    setFullName,
    gender,
    setGender,
    dateOfBirth,
    setDateOfBirth,
    businessName,
    setBusinessName,
    yearsExperience,
    setYearsExperience,
    bio,
    setBio,
    phoneIso,
    setPhoneIso,
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
    guarantorName,
    setGuarantorName,
    guarantorPhone,
    setGuarantorPhone,
    guarantorAddress,
    setGuarantorAddress,
    guarantorOccupation,
    setGuarantorOccupation,
    guarantorRelationship,
    setGuarantorRelationship,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    city,
    setCity,
    area,
    setArea,
    serviceRadiusKm,
    setServiceRadiusKm,
    fullPhone,
  };
}

export type ProSignupForm = ReturnType<typeof useProSignupForm>;
