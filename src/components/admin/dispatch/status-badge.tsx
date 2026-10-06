export function StatusBadge({ status }: { status: string }) {
  const pairing =
    status === "waiting_for_selected" ||
    status === "selected_review" ||
    status === "sequential_pairing" ||
    status === "waiting_for_pro" ||
    status === "reserved";
  const tone = pairing
    ? "background:#818cf8;color:#1e1b4b"
    : status === "searching"
      ? "background:#fbbf24;color:#451a03"
      : status === "negotiating"
        ? "background:#fb923c;color:#431407"
        : "background:#34d399;color:#052e16";
  return (
    <span className="om-admin-badge" style={{ ...parseStyle(tone) }}>
      {status}
    </span>
  );
}

function parseStyle(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of s.split(";")) {
    const i = pair.indexOf(":");
    if (i > 0) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return out;
}
