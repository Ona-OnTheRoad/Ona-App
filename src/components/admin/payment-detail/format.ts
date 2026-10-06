export function nairaFromKobo(k: number) {
  return `₦${(k / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
