import {
  bvnError,
  confirmPasswordError,
  dobError,
  emailError,
  fullNameError,
  genderError,
  isValidEmail,
  isValidPassword,
  ninError,
  passwordError,
  phoneNationalError,
} from "@/lib/signup-validation";
import { BIO_MAX } from "./constants";
import type { ProSignupForm } from "./use-pro-signup-form";

type AboutValues = Pick<
  ProSignupForm,
  | "fullName"
  | "gender"
  | "dateOfBirth"
  | "phoneNational"
  | "businessName"
  | "guarantorName"
  | "guarantorPhone"
  | "guarantorRelationship"
  | "yearsExperience"
  | "bio"
>;

type ContactValues = Pick<
  ProSignupForm,
  | "dualSignup"
  | "phoneNational"
  | "email"
  | "idNumber"
  | "bvn"
  | "password"
  | "confirmPassword"
>;

type AreaValues = Pick<ProSignupForm, "city" | "area" | "serviceRadiusKm">;

export function isStep4Ok(f: AboutValues): boolean {
  return (
    !fullNameError(f.fullName) &&
    !genderError(f.gender) &&
    !dobError(f.dateOfBirth) &&
    !phoneNationalError(f.phoneNational) &&
    f.businessName.trim().length >= 2 &&
    f.guarantorName.trim().length >= 2 &&
    f.guarantorPhone.replace(/\D/g, "").length >= 7 &&
    f.guarantorRelationship.trim().length >= 2 &&
    f.yearsExperience.trim().length > 0 &&
    f.bio.trim().length >= 2 &&
    f.bio.trim().length <= BIO_MAX
  );
}

/** Dual signup: reuse existing Customer password (min 6 for server) */
export const isDualPasswordOk = (password: string) =>
  password.trim().length >= 6;

export function isStep5Ok(f: ContactValues): boolean {
  return f.dualSignup
    ? !phoneNationalError(f.phoneNational) &&
        isValidEmail(f.email) &&
        !ninError(f.idNumber) &&
        !bvnError(f.bvn) &&
        isDualPasswordOk(f.password)
    : !phoneNationalError(f.phoneNational) &&
        isValidEmail(f.email) &&
        isValidPassword(f.password) &&
        f.confirmPassword === f.password &&
        f.confirmPassword.length > 0 &&
        !ninError(f.idNumber) &&
        !bvnError(f.bvn);
}

export function isStep6Ok(f: AreaValues): boolean {
  return (
    f.city.trim().length >= 2 &&
    f.area.trim().length >= 2 &&
    f.serviceRadiusKm >= 1
  );
}

export function validateStep4(f: AboutValues): string | null {
  if (fullNameError(f.fullName)) return fullNameError(f.fullName);
  if (genderError(f.gender)) return genderError(f.gender);
  if (dobError(f.dateOfBirth)) return dobError(f.dateOfBirth);
  if (phoneNationalError(f.phoneNational)) {
    return phoneNationalError(f.phoneNational);
  }
  if (f.businessName.trim().length < 2)
    return "Please enter your business or workshop name.";
  if (f.guarantorName.trim().length < 2)
    return "Enter your guarantor's full name.";
  if (f.guarantorPhone.replace(/\D/g, "").length < 7)
    return "Enter a valid guarantor phone number.";
  if (f.guarantorRelationship.trim().length < 2)
    return "Enter your relationship with the guarantor.";
  if (!f.yearsExperience.trim())
    return "Please pick how many years you have worked.";
  if (f.bio.trim().length < 2) return "Please write a short bio.";
  if (f.bio.trim().length > BIO_MAX)
    return `Bio must be ${BIO_MAX} characters or less.`;
  return null;
}

export function validateStep5(f: ContactValues): string | null {
  if (f.dualSignup) {
    const base =
      phoneNationalError(f.phoneNational) ||
      emailError(f.email) ||
      ninError(f.idNumber) ||
      bvnError(f.bvn);
    if (base) return base;
    if (!isDualPasswordOk(f.password)) {
      return "Enter the same password you use for your Customer account.";
    }
    return null;
  }
  return (
    phoneNationalError(f.phoneNational) ||
    emailError(f.email) ||
    ninError(f.idNumber) ||
    bvnError(f.bvn) ||
    passwordError(f.password) ||
    confirmPasswordError(f.password, f.confirmPassword)
  );
}
