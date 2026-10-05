import type { LEVEL_GUIDE } from "./levels";

export function LevelCards({
  counts,
}: {
  counts: ((typeof LEVEL_GUIDE)[number] & { count: number })[];
}) {
  return (
    <div
      className="om-admin-panel"
      style={{ marginBottom: 16 }}
      aria-label="Access levels Level 1 to Level 5"
    >
      <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
        Levels 1, 5
      </h2>
      <p className="om-admin-muted" style={{ marginBottom: 12 }}>
        These are the only access levels. Your account must be L4 or L5 to open
        this page and assign roles.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {counts.map((l) => (
          <div
            key={l.value}
            style={{
              borderRadius: 12,
              padding: "12px 12px 10px",
              background: l.soft,
              border: `1px solid ${l.color}33`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: l.color,
              }}
            >
              Level {l.level}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                fontWeight: 800,
                color: l.color,
              }}
            >
              {l.label}
            </div>
            <div
              className="om-admin-muted"
              style={{ marginTop: 6, fontSize: 11, lineHeight: 1.35 }}
            >
              {l.blurb}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                fontWeight: 700,
                color: l.color,
              }}
            >
              {l.count} staff
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
