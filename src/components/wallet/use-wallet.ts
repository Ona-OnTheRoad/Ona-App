"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReferralData, TxData, WalletData } from "./wallet-types";

export function useWallet(backendUserId: string | null | undefined) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [txs, setTxs] = useState<TxData>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashoutBusy, setCashoutBusy] = useState(false);
  const [cashoutMsg, setCashoutMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!backendUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { authFetch } = await import("@/lib/api-auth-headers");
      const [walletRes, refRes] = await Promise.all([
        authFetch(
          `/api/security/wallet?userId=${encodeURIComponent(backendUserId)}`,
        ),
        authFetch(
          `/api/security/referral?userId=${encodeURIComponent(backendUserId)}`,
        ),
      ]);
      const wJson = await walletRes.json();
      const rJson = await refRes.json();
      if (wJson.ok) {
        setWallet(wJson.data.wallet);
        setTxs(wJson.data.transactions || []);
      }
      if (rJson.ok) setReferral(rJson.data);
    } catch {
      /* */
    }
    setLoading(false);
  }, [backendUserId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCopy = async () => {
    if (!referral?.code.referralCode) return;
    try {
      await navigator.clipboard.writeText(referral.code.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* */
    }
  };

  const handleCashout = async () => {
    if (!cashoutAmount || !backendUserId) return;
    setCashoutBusy(true);
    setCashoutMsg(null);
    try {
      const { authFetch } = await import("@/lib/api-auth-headers");
      const res = await authFetch("/api/security/cashout", {
        method: "POST",
        body: JSON.stringify({
          userId: backendUserId,
          requestedAmount: Number(cashoutAmount),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setCashoutMsg("Cashout request submitted. Awaiting admin approval.");
        setCashoutAmount("");
        void fetchData();
      } else {
        setCashoutMsg(json.error || "Failed");
      }
    } catch {
      setCashoutMsg("Network error");
    }
    setCashoutBusy(false);
  };

  return {
    wallet,
    referral,
    txs,
    loading,
    copied,
    cashoutAmount,
    setCashoutAmount,
    cashoutBusy,
    cashoutMsg,
    handleCopy,
    handleCashout,
  };
}
