import type { MotoristProfileRow, Detail } from "./types";

export function ProfilePanel({
  u,
  mot,
  busy,
  onToggleActive,
  onHardDelete,
}: {
  u: Detail["user"] | undefined;
  mot: MotoristProfileRow | null;
  busy: boolean;
  onToggleActive: () => void;
  onHardDelete: () => void;
}) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <div className="om-admin-toolbar">
        <strong>Profile</strong>
        <div className="om-admin-row-actions" style={{ marginLeft: "auto" }}>
          <button
            type="button"
            className="om-admin-btn"
            disabled={busy}
            onClick={() => onToggleActive()}
          >
            {u?.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className="om-admin-btn ghost"
            disabled={busy}
            onClick={() => onHardDelete()}
            style={{ color: "#b91c1c" }}
          >
            Delete permanently
          </button>
        </div>
      </div>
      <table className="om-admin-table">
        <tbody>
          <tr>
            <th style={{ width: 160 }}>Email</th>
            <td>{u?.email || ""}</td>
          </tr>
          <tr>
            <th>Phone</th>
            <td>{u?.phone || ""}</td>
          </tr>
          <tr>
            <th>Location</th>
            <td>
              {[u?.area, u?.city].filter(Boolean).join(", ") ||
                mot?.address_text ||
                ""}
            </td>
          </tr>
          <tr>
            <th>Joined</th>
            <td>
              {u?.created_at ? new Date(u.created_at).toLocaleString() : ""}
            </td>
          </tr>
          <tr>
            <th>User ID</th>
            <td className="om-admin-muted">{u?.id}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function VehiclePanel({ mot }: { mot: MotoristProfileRow | null }) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <div className="om-admin-toolbar">
        <strong>Vehicle</strong>
      </div>
      <table className="om-admin-table">
        <tbody>
          <tr>
            <th style={{ width: 160 }}>Make / model / year</th>
            <td>
              {[mot?.vehicle_make, mot?.vehicle_model, mot?.vehicle_year]
                .filter(Boolean)
                .join(" ") || ""}
            </td>
          </tr>
          <tr>
            <th>Plate</th>
            <td>{mot?.plate_number || ""}</td>
          </tr>
          <tr>
            <th>Map pin</th>
            <td className="om-admin-muted">
              {mot?.default_lat != null && mot?.default_lng != null
                ? `${mot.default_lat.toFixed(5)}, ${mot.default_lng.toFixed(5)}`
                : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function IdentityPanel({ mot }: { mot: MotoristProfileRow | null }) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <div className="om-admin-toolbar">
        <strong>Identity (NIN / BVN)</strong>
      </div>
      <table className="om-admin-table">
        <tbody>
          <tr>
            <th style={{ width: 160 }}>NIN</th>
            <td>
              {mot?.nin_verified ? "Verified" : "Not verified"}
              {mot?.nin_last4 ? ` · ends …${mot.nin_last4}` : ""}
            </td>
          </tr>
          <tr>
            <th>BVN</th>
            <td>
              {mot?.bvn_verified ? "Verified" : "Not verified"}
              {mot?.bvn_last4 ? ` · ends …${mot.bvn_last4}` : ""}
            </td>
          </tr>
          <tr>
            <th>Verified at</th>
            <td>
              {mot?.identity_verified_at
                ? new Date(mot.identity_verified_at).toLocaleString()
                : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
