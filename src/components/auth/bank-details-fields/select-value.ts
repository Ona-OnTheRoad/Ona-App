export function selectValue(code: string, name: string) {
  if (!code) return "";
  return `${code}::${name || ""}`;
}

export function parseSelectValue(raw: string): { code: string; name: string } {
  if (!raw) return { code: "", name: "" };
  const i = raw.indexOf("::");
  if (i < 0) return { code: raw, name: "" };
  return { code: raw.slice(0, i), name: raw.slice(i + 2) };
}
