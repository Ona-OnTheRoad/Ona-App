export type AddressLabel = "Home" | "Work" | "Other";

export type SavedAddress = {
  id: string;
  label: AddressLabel;
  customLabel?: string;
  text: string;
  lat: number;
  lng: number;
};

const ADDR_KEY = "ona-saved-addresses-v1";

export function loadAddresses(uid: string): SavedAddress[] {
  try {
    const raw = localStorage.getItem(`${ADDR_KEY}:${uid}`);
    if (!raw) return [];
    const p = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function saveAddresses(uid: string, list: SavedAddress[]) {
  try {
    localStorage.setItem(`${ADDR_KEY}:${uid}`, JSON.stringify(list));
  } catch {
    /* */
  }
}
