import type { Dispatch, SetStateAction } from "react";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { CALLOUT_FOURTEENTH_TRADE } from "@/lib/callout/constants";
import { PlainForm } from "@/components/admin/shared-lists/plain-form";
import type { CalloutPolicyAdmin, CalloutTradeAdmin } from "./types";

export function CalloutPanel({
  calloutPolicy,
  setCalloutPolicy,
  calloutTrades,
  setCalloutTrades,
}: {
  calloutPolicy: CalloutPolicyAdmin | null;
  setCalloutPolicy: Dispatch<SetStateAction<CalloutPolicyAdmin | null>>;
  calloutTrades: CalloutTradeAdmin[];
  setCalloutTrades: Dispatch<SetStateAction<CalloutTradeAdmin[]>>;
}) {
  return (
    <div className="om-admin-panel" style={{ marginTop: "1rem" }}>
      <div className="om-admin-toolbar">
        <strong>Call-out fee</strong>
      </div>
      <div style={{ padding: "1rem" }}>
        {!calloutPolicy ? (
          <p className="om-admin-muted">Loading…</p>
        ) : (
          <PlainForm>
            <label className="om-admin-switch">
              <input
                type="checkbox"
                checked={calloutPolicy.enabled}
                onChange={(e) =>
                  setCalloutPolicy({
                    ...calloutPolicy,
                    enabled: e.target.checked,
                  })
                }
              />
              Call-out enabled
            </label>
            <label>
              Rate per km (₦)
              <input
                type="number"
                min={1}
                max={100000}
                value={calloutPolicy.ratePerKm}
                onChange={(e) =>
                  setCalloutPolicy({
                    ...calloutPolicy,
                    ratePerKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Minimum billable distance (km)
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={calloutPolicy.minimumBillableDistanceKm}
                onChange={(e) =>
                  setCalloutPolicy({
                    ...calloutPolicy,
                    minimumBillableDistanceKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Maximum radius (km)
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.1}
                value={calloutPolicy.maximumRadiusKm}
                onChange={(e) =>
                  setCalloutPolicy({
                    ...calloutPolicy,
                    maximumRadiusKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Billing increment (km)
              <input
                type="number"
                min={0.1}
                max={1}
                step={0.1}
                value={calloutPolicy.billingIncrementKm}
                onChange={(e) =>
                  setCalloutPolicy({
                    ...calloutPolicy,
                    billingIncrementKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <p className="om-admin-muted" style={{ marginTop: "0.75rem" }}>
              Trade base fees (₦).{" "}
              {PRO_SERVICE_LABELS[CALLOUT_FOURTEENTH_TRADE]} is the existing
              14th trade.
            </p>
            {calloutTrades.map((t) => (
              <label key={t.tradeId}>
                {PRO_SERVICE_LABELS[t.tradeId] ?? t.tradeId}
                {t.tradeId === CALLOUT_FOURTEENTH_TRADE ? " (14th)" : ""}
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={t.baseFee}
                  onChange={(e) =>
                    setCalloutTrades((prev) =>
                      prev.map((x) =>
                        x.tradeId === t.tradeId
                          ? { ...x, baseFee: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </PlainForm>
        )}
      </div>
    </div>
  );
}
