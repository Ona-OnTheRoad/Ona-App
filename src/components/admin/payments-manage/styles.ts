export const styles = {
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  header: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  sub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 0,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  card: (tone?: string) => ({
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background:
      tone === "available"
        ? "#f0fdf4"
        : tone === "ledger"
          ? "#faf5ff"
          : tone === "held"
            ? "#fff7ed"
            : tone === "pending"
              ? "#fffbeb"
              : tone === "released"
                ? "#ecfdf5"
                : tone === "failed"
                  ? "#fef2f2"
                  : tone === "refunded"
                    ? "#f8fafc"
                    : "#fff",
  }),
  cardLabel: {
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  cardVal: { fontSize: 20, fontWeight: 700, marginTop: 4 },
  cardSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "2px solid #e5e7eb",
    color: "#6b7280",
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top" as const,
  },
  badge: (type: string) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background:
      type === "released"
        ? "#d1fae5"
        : type === "held"
          ? "#fed7aa"
          : type === "pending_settlement" || type === "pending"
            ? "#fde68a"
            : type === "failed"
              ? "#fecaca"
              : type === "refunded"
                ? "#e2e8f0"
                : type === "suspended"
                  ? "#e0e7ff"
                  : "#f3f4f6",
    color:
      type === "released"
        ? "#065f46"
        : type === "held"
          ? "#9a3412"
          : type === "pending_settlement" || type === "pending"
            ? "#92400e"
            : type === "failed"
              ? "#991b1b"
              : type === "refunded"
                ? "#475569"
                : type === "suspended"
                  ? "#3730a3"
                  : "#374151",
  }),
  btn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  btnPrimary: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  btnDanger: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #fca5a5",
    background: "#fff",
    color: "#b91c1c",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
  },
  input: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box" as const,
  },
  textarea: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  panel: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    background: "#fff",
  },
  error: {
    padding: "8px 14px",
    borderRadius: 6,
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    fontSize: 13,
    marginBottom: 12,
  },
  success: {
    padding: "8px 14px",
    borderRadius: 6,
    background: "#f0fdf4",
    color: "#065f46",
    border: "1px solid #bbf7d0",
    fontSize: 13,
    marginBottom: 12,
  },
  muted: { fontSize: 12, color: "#9ca3af" },
  link: {
    color: "#2563eb",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: 12,
  },
  flex: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    alignItems: "center",
  },
};
