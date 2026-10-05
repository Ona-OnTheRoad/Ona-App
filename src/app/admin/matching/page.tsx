"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import type {
  AppConfig,
  MatchingSection,
  VerificationSection,
} from "@/lib/app-config";
import type {
  CalloutPolicyAdmin,
  CalloutTradeAdmin,
} from "@/components/admin/matching/types";
import {
  MatchingPanel,
  VerificationPanel,
} from "@/components/admin/matching/matching-panels";
import { CalloutPanel } from "@/components/admin/matching/callout-panel";

export default function AdminMatchingPage() {
  const { adminName, ready, api } = useAdminGate();
  const [matching, setMatching] = useState<MatchingSection | null>(null);
  const [verification, setVerification] = useState<VerificationSection | null>(
    null,
  );
  const [calloutPolicy, setCalloutPolicy] = useState<CalloutPolicyAdmin | null>(
    null,
  );
  const [calloutTrades, setCalloutTrades] = useState<CalloutTradeAdmin[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const res = await api<{ config: AppConfig }>("/api/admin/settings");
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setMatching(res.data.config.matching);
      setVerification(res.data.config.verification);
      const c = await api<{
        policy: CalloutPolicyAdmin;
        trades: CalloutTradeAdmin[];
      }>("/api/admin/callout");
      if (c.ok) {
        setCalloutPolicy(c.data.policy);
        setCalloutTrades(c.data.trades);
      }
    })();
  }, [ready, api]);

  async function save() {
    if (!matching || !verification) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    const a = await api<{ config: AppConfig }>("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "matching", value: matching }),
    });
    if (!a.ok) {
      setBusy(false);
      setError(a.message);
      return;
    }
    const b = await api<{ config: AppConfig }>("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "verification", value: verification }),
    });
    setBusy(false);
    if (!b.ok) {
      setError(b.message);
      return;
    }
    setMatching(b.data.config.matching);
    setVerification(b.data.config.verification);

    if (calloutPolicy) {
      const c = await api("/api/admin/callout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy: calloutPolicy,
          trades: calloutTrades,
          reason: "Admin matching page save",
        }),
      });
      if (!c.ok) {
        setError(c.message);
        return;
      }
    }
    setMsg("Matching, verification, and call-out rules saved.");
  }

  return (
    <AdminShell adminName={adminName}>
      <h1 className="om-admin-h1">Map & matching</h1>
      <p className="om-admin-sub">
        Map radius and matching rules that decide which pros customers see on
        the live map.
      </p>

      <AdminGuideBanner pageId="matching" />

      {error ? <div className="om-admin-error">{error}</div> : null}
      {msg ? <div className="om-admin-success">{msg}</div> : null}

      <div className="om-admin-grid-2">
        <MatchingPanel matching={matching} setMatching={setMatching} />

        <VerificationPanel
          verification={verification}
          setVerification={setVerification}
        />
      </div>

      <CalloutPanel
        calloutPolicy={calloutPolicy}
        setCalloutPolicy={setCalloutPolicy}
        calloutTrades={calloutTrades}
        setCalloutTrades={setCalloutTrades}
      />

      <button
        type="button"
        className="om-admin-btn"
        disabled={busy || !matching}
        onClick={save}
      >
        {busy ? "Saving…" : "Save matching & verification"}
      </button>
    </AdminShell>
  );
}
