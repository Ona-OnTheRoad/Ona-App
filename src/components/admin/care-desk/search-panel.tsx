import type { SearchHit } from "./types";

export function SearchPanel({
  query,
  setQuery,
  hits,
  openJob,
}: {
  query: string;
  setQuery: (v: string) => void;
  hits: SearchHit[];
  openJob: (id: string) => Promise<void>;
}) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: "1rem" }}>
      <label
        className="om-admin-muted"
        style={{ display: "block", marginBottom: 6 }}
      >
        Search phone · name · job ID · plate
      </label>
      <input
        className="om-admin-input"
        style={{ width: "100%", maxWidth: 520 }}
        placeholder="e.g. 0803… or ABC-123 or job uuid"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {hits.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0" }}>
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`} style={{ marginBottom: 6 }}>
              <button
                type="button"
                className="om-admin-btn ghost"
                style={{ textAlign: "left", width: "100%" }}
                onClick={() => {
                  if (h.kind === "job") void openJob(h.id);
                  else window.location.href = `/admin/users`; // directory
                }}
              >
                <strong>
                  [{h.kind}] {h.title}
                </strong>
                <br />
                <span className="om-admin-muted">{h.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
