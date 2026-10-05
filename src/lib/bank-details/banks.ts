export type BankOption = { name: string; code: string };

/** Offline / API-down fallback (Flutterwave-style codes) */
export const NG_BANKS: BankOption[] = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Opay", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

function normalizeBankCode(code: string): string {
  return String(code || "").trim();
}

export function bankNameForCode(
  code: string | null | undefined,
  list: BankOption[] = NG_BANKS,
): string {
  const c = normalizeBankCode(code || "");
  if (!c) return "";
  const exact = list.find((b) => normalizeBankCode(b.code) === c);
  if (exact) return exact.name;
  // Some lists pad codes differently (e.g. 057 vs 57)
  const stripped = c.replace(/^0+/, "") || c;
  const loose = list.find((b) => {
    const bc = normalizeBankCode(b.code);
    return bc === c || (bc.replace(/^0+/, "") || bc) === stripped;
  });
  return loose?.name || "";
}

export function bankCodeForName(
  name: string | null | undefined,
  list: BankOption[] = NG_BANKS,
): string {
  const n = (name || "").trim().toLowerCase();
  if (!n) return "";
  const exact = list.find((b) => b.name.toLowerCase() === n);
  if (exact) return exact.code;
  const partial = list.find(
    (b) => b.name.toLowerCase().includes(n) || n.includes(b.name.toLowerCase()),
  );
  return partial?.code || "";
}
