export function BackupPanel({
  backupBusy,
  busy,
  latestBackup,
  backupSearch,
  setBackupSearch,
  backupSnaps,
  runBackupNow,
}: {
  backupBusy: boolean;
  busy: boolean;
  latestBackup: string | null;
  backupSearch: string;
  setBackupSearch: (v: string) => void;
  backupSnaps: {
    id: string;
    fileCount: number;
    files: { name: string; size: number }[];
  }[];
  runBackupNow: () => Promise<void>;
}) {
  return (
    <div
      className="om-admin-panel"
      style={{
        marginBottom: "1rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.75rem",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Local BackUp</div>
        <p
          className="om-admin-muted"
          style={{ margin: "4px 0 0", fontSize: 12 }}
        >
          Saves payments + jobs + banks to <code>Local BackUp/snapshots/</code>{" "}
          on this machine. Also runs automatically after payment status changes
          (held / released / refunded).
          {latestBackup ? (
            <>
              {" "}
              Latest: <strong>{latestBackup}</strong>
            </>
          ) : (
            " No snapshot yet."
          )}
        </p>
      </div>
      <button
        type="button"
        className="om-admin-btn"
        disabled={backupBusy || busy}
        onClick={() => void runBackupNow()}
        style={{
          background: "#FF6B35",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: 13,
          cursor: backupBusy ? "wait" : "pointer",
          opacity: backupBusy ? 0.7 : 1,
        }}
      >
        {backupBusy ? "Backing up…" : "Backup now"}
      </button>
      <div style={{ width: "100%", marginTop: 8 }}>
        <input
          type="search"
          value={backupSearch}
          onChange={(e) => setBackupSearch(e.target.value)}
          placeholder="Search backup directories & files…"
          style={{
            width: "100%",
            maxWidth: 360,
            height: 34,
            border: "none",
            borderRadius: 8,
            padding: "0 10px",
            fontSize: 12,
            fontWeight: 600,
            background: "var(--om-admin-chip-bg, rgba(0,0,0,0.06))",
          }}
        />
        {backupSnaps.length > 0 ? (
          <ul
            style={{
              margin: "8px 0 0",
              padding: 0,
              listStyle: "none",
              maxHeight: 160,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {backupSnaps.slice(0, 12).map((s) => (
              <li key={s.id} style={{ padding: "4px 0" }}>
                <strong>{s.id}</strong>
                <span className="om-admin-muted">
                  {" "}
                  · {s.fileCount} files
                  {s.files?.[0]
                    ? ` · e.g. ${s.files
                        .slice(0, 3)
                        .map((f) => f.name)
                        .join(", ")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
