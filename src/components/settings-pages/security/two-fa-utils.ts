export const TWO_FA_KEY = "ona-2fa-enabled-v2";
export const TWO_FA_METHOD_KEY = "ona-2fa-method-v2";
export const TWO_FA_SECRET_KEY = "ona-2fa-secret-v2";

export type TwoFaMethod = "sms" | "authenticator" | null;
export type SetupStep = "idle" | "pick" | "sms" | "authenticator";

export function randomSecret(len = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Simple demo TOTP-style code from secret + 30s window (not production crypto) */
export function demoTotpCode(secret: string): string {
  const window = Math.floor(Date.now() / 30000);
  let h = 0;
  const s = `${secret}:${window}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(h % 1000000).padStart(6, "0");
}

export function storageKey(base: string, email?: string) {
  return `${base}:${email || "guest"}`;
}

/** otpauth URI for authenticator apps (TOTP) */
export function authenticatorOtpauth(secret: string, account: string): string {
  const label = encodeURIComponent(`Ona:${account || "user"}`);
  const issuer = encodeURIComponent("Ona");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

/** QR image URL for scanning (setup only one small load) */
export function authenticatorQrUrl(secret: string, account: string): string {
  const data = encodeURIComponent(authenticatorOtpauth(secret, account));
  return `https://api.qrserver.com/v1/create-qr-code/?size=168x168&ecc=M&margin=8&data=${data}`;
}
