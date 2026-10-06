import type { Detail } from "./types";

export function JobsPanel({ jobs }: { jobs: Detail["jobs"] }) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <div className="om-admin-toolbar">
        <strong>Jobs / service requests</strong>
      </div>
      <table className="om-admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Service</th>
            <th>Status</th>
            <th>Where</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={4} className="om-admin-muted">
                No jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((j) => (
              <tr key={j.id}>
                <td className="om-admin-muted">
                  {new Date(j.created_at).toLocaleString()}
                </td>
                <td>{j.service_type}</td>
                <td>
                  <span className="om-admin-badge pending">{j.status}</span>
                </td>
                <td>{j.pickup_address || ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function BookingsPanel({ bookings }: { bookings: Detail["bookings"] }) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <div className="om-admin-toolbar">
        <strong>Bookings</strong>
      </div>
      <table className="om-admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Status</th>
            <th>Scheduled</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={3} className="om-admin-muted">
                No bookings yet.
              </td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.id}>
                <td className="om-admin-muted">
                  {new Date(b.created_at).toLocaleString()}
                </td>
                <td>{b.status || ""}</td>
                <td>
                  {b.scheduled_at
                    ? new Date(b.scheduled_at).toLocaleString()
                    : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentsPanel({ payments }: { payments: Detail["payments"] }) {
  return (
    <div className="om-admin-panel">
      <div className="om-admin-toolbar">
        <strong>Payments</strong>
      </div>
      <table className="om-admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={3} className="om-admin-muted">
                No payments yet.
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id}>
                <td className="om-admin-muted">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td>₦{(Number(p.amount_kobo || 0) / 100).toLocaleString()}</td>
                <td>{p.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
