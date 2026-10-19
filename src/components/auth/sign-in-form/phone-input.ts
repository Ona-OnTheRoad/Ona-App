import {
  formatInternationalPhone,
  getPhoneCodeOptions,
  splitStoredPhone,
} from "@/lib/phone-codes";

/** Min national digits before a number that already starts with the dial code is treated as full. */
const MIN_NATIONAL_DIGITS = 10;

/**
 * Compose the country dial + national field into the value sent to the API.
 * Returns "" when no digits were typed so the "enter your phone" check still
 * fires. A pasted full number (+234…, 00234…, or 234… with enough digits) is
 * kept as-is, so it is at least as valid as the single free-text field was.
 */
export function composeLoginPhone(dial: string, national: string): string {
  const raw = national.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  const d = dial.replace(/\D/g, "");
  if (
    d &&
    digits.startsWith(d) &&
    digits.length >= d.length + MIN_NATIONAL_DIGITS
  ) {
    return `+${digits}`;
  }
  return formatInternationalPhone(d, digits);
}

/** When a full +country number is typed/pasted, split it so the chip follows. */
export function splitPastedPhone(
  raw: string,
): { iso: string; national: string } | null {
  const t = raw.trim();
  if (!t.startsWith("+")) return null;
  if (!getPhoneCodeOptions().length) return null;
  const s = splitStoredPhone(t);
  return { iso: s.iso, national: s.national };
}

/** "+2348012344567" -> "+234 801 ••• 4567" for the verification subtitle. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const { dial, national } = splitStoredPhone(phone);
  if (national.length < 8) return `+${dial} ••• ${national.slice(-2)}`.trim();
  return `+${dial} ${national.slice(0, 3)} ••• ${national.slice(-4)}`;
}

/** 45 -> "00:45" */
export function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
