import { checkIdentityAvailable } from "@/lib/account-registry";
import { validateIdFormat, type CountryIdDoc } from "@/lib/country-id-rules";
import {
  confirmPasswordError,
  dobError,
  emailError,
  fullNameError,
  genderError,
  isValidEmail,
  isValidFullName,
  isValidPassword,
  passwordError,
  phoneNationalError,
} from "@/lib/signup-validation";

export type AccountValues = {
  dualSignup: boolean;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNational: string;
  email: string;
  idNumber: string;
  bvn: string;
  password: string;
  confirmPassword: string;
  primaryDoc: CountryIdDoc | undefined;
  bankDoc: CountryIdDoc | undefined;
};

/** Dual signup: reuse existing password (min 6 for server), not a new-password checklist */
export function isDualPasswordOk(password: string): boolean {
  return password.trim().length >= 6;
}

/** Optional at signup if filled, must match this country’s rules */
export function optionalIdError(v: AccountValues): string | null {
  if (v.idNumber.trim() && v.primaryDoc) {
    const r = validateIdFormat(v.idNumber.trim(), v.primaryDoc);
    if (!r.ok) return r.message;
  }
  if (v.bvn.trim() && v.bankDoc) {
    const r = validateIdFormat(v.bvn.trim(), v.bankDoc);
    if (!r.ok) return r.message;
  }
  return null;
}

export function isStep1Ok(v: AccountValues): boolean {
  const genderDobOk = !genderError(v.gender) && !dobError(v.dateOfBirth);
  return v.dualSignup
    ? isValidFullName(v.fullName) &&
        genderDobOk &&
        !phoneNationalError(v.phoneNational) &&
        isValidEmail(v.email) &&
        isDualPasswordOk(v.password) &&
        !optionalIdError(v)
    : isValidFullName(v.fullName) &&
        genderDobOk &&
        !phoneNationalError(v.phoneNational) &&
        isValidEmail(v.email) &&
        isValidPassword(v.password) &&
        v.confirmPassword === v.password &&
        v.confirmPassword.length > 0 &&
        !optionalIdError(v);
}

export function validateStep1(v: AccountValues): string | null {
  if (v.dualSignup) {
    const base =
      fullNameError(v.fullName) ||
      genderError(v.gender) ||
      dobError(v.dateOfBirth) ||
      phoneNationalError(v.phoneNational) ||
      emailError(v.email) ||
      optionalIdError(v);
    if (base) return base;
    if (!isDualPasswordOk(v.password)) {
      return "Enter the same password you use for your Repair Pro account.";
    }
    return null;
  }
  return (
    fullNameError(v.fullName) ||
    genderError(v.gender) ||
    dobError(v.dateOfBirth) ||
    phoneNationalError(v.phoneNational) ||
    emailError(v.email) ||
    optionalIdError(v) ||
    passwordError(v.password) ||
    confirmPasswordError(v.password, v.confirmPassword)
  );
}

export function isStep2Ok(city: string, area: string): boolean {
  return city.trim().length >= 2 && area.trim().length >= 2;
}

/** Screen 1 ("Create account"): everything except the password fields. */
export function validateDetails(v: AccountValues): string | null {
  return (
    fullNameError(v.fullName) ||
    genderError(v.gender) ||
    dobError(v.dateOfBirth) ||
    phoneNationalError(v.phoneNational) ||
    emailError(v.email) ||
    optionalIdError(v)
  );
}

/** Current field values as the validators expect them. */
export function accountValuesOf(f: AccountValues): AccountValues {
  return {
    dualSignup: f.dualSignup,
    fullName: f.fullName,
    gender: f.gender,
    dateOfBirth: f.dateOfBirth,
    phoneNational: f.phoneNational,
    email: f.email,
    idNumber: f.idNumber,
    bvn: f.bvn,
    password: f.password,
    confirmPassword: f.confirmPassword,
    primaryDoc: f.primaryDoc,
    bankDoc: f.bankDoc,
  };
}

/** Phone/email/NIN/BVN must not already belong to a Customer (dual signup is exempt). */
export function identityConflict(
  v: AccountValues,
  fullPhone: string,
): string | null {
  if (v.dualSignup) return null;
  const check = checkIdentityAvailable({
    phone: fullPhone,
    email: v.email.trim(),
    nin: v.idNumber.trim() || undefined,
    bvn: v.bvn.trim() || undefined,
    accountType: "motorist",
  });
  return check.ok ? null : check.message;
}
