"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bankAccountMatchesSignupName,
  bankNameForCode,
  checkBankAccountAvailable,
  fetchCountryBanks,
  NG_BANKS,
  resolveNigeriaAccountName,
  type BankOption,
} from "@/lib/bank-details";
import { parseSelectValue, selectValue } from "./select-value";
import type { BankDetailsValue } from "./types";

export function useBankDetailsFields({
  initial,
  onChange,
  signupFullName,
  countryIso,
}: {
  initial?: Partial<BankDetailsValue>;
  onChange?: (v: BankDetailsValue) => void;
  signupFullName?: string | null;
  countryIso?: string | null;
}) {
  const [banks, setBanks] = useState<BankOption[]>(NG_BANKS);
  const [bankCode, setBankCode] = useState(initial?.bankCode || "");
  const [bankName, setBankName] = useState(initial?.bankName || "");
  const [bankAccountName, setBankAccountName] = useState(
    initial?.bankAccountName || "",
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initial?.bankAccountNumber || "",
  );
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolveMsg, setResolveMsg] = useState<string | null>(null);
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResolved = useRef("");

  const emit = useCallback(
    (next: BankDetailsValue) => {
      onChange?.(next);
    },
    [onChange],
  );

  const iso = (countryIso || "NG").toUpperCase().slice(0, 2);

  useEffect(() => {
    let cancelled = false;
    setLoadingBanks(true);
    void fetchCountryBanks(iso)
      .then((r) => {
        if (cancelled || !r.banks.length) return;
        setBanks(r.banks);
      })
      .finally(() => {
        if (!cancelled) setLoadingBanks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [iso]);

  // Sync initial from parent when profile loads
  useEffect(() => {
    if (!initial) return;
    if (initial.bankCode != null) setBankCode(initial.bankCode || "");
    if (initial.bankName != null) setBankName(initial.bankName || "");
    if (initial.bankAccountName != null)
      setBankAccountName(initial.bankAccountName || "");
    if (initial.bankAccountNumber != null)
      setBankAccountNumber(initial.bankAccountNumber || "");
  }, [
    initial?.bankCode,
    initial?.bankName,
    initial?.bankAccountName,
    initial?.bankAccountNumber,
  ]);

  // After banks load, fill bank name from code if missing
  useEffect(() => {
    if (!bankCode || bankName) return;
    const n = bankNameForCode(bankCode, banks);
    if (n) {
      setBankName(n);
      emit({
        bankCode,
        bankName: n,
        bankAccountName,
        bankAccountNumber,
      });
    }
  }, [banks, bankCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const runResolve = useCallback(
    async (code: string, number: string) => {
      const key = `${code}:${number}`;
      if (lastResolved.current === key) return;
      setResolving(true);
      setResolveMsg(null);
      const res = await resolveNigeriaAccountName({
        bankCode: code,
        accountNumber: number,
      });
      setResolving(false);
      if (res.ok) {
        lastResolved.current = key;
        const match = bankAccountMatchesSignupName(
          res.accountName,
          signupFullName,
        );
        setBankAccountName(res.accountName);
        setResolveMsg(
          match.ok || !signupFullName?.trim() ? "Name verified" : null,
        );
        emit({
          bankCode: code,
          bankName: bankName || bankNameForCode(code, banks),
          bankAccountName: res.accountName,
          bankAccountNumber: number,
        });
      } else {
        setResolveMsg(res.error);
      }
    },
    [bankName, banks, emit, signupFullName],
  );

  // Auto-resolve name + uniqueness when bank + 10 digits ready
  useEffect(() => {
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    const num = bankAccountNumber.replace(/\D/g, "");
    if (!bankCode || num.length !== 10) {
      return;
    }
    resolveTimer.current = setTimeout(() => {
      void (async () => {
        await runResolve(bankCode, num);
        const uniq = await checkBankAccountAvailable({
          bankCode,
          accountNumber: num,
        });
        if (!uniq.ok) {
          setResolveMsg(uniq.error);
        }
      })();
    }, 450);
    return () => {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
    };
  }, [bankCode, bankAccountNumber, runResolve]);

  const selectVal = useMemo(
    () => selectValue(bankCode, bankName),
    [bankCode, bankName],
  );

  const onSelectBank = (raw: string) => {
    const { code, name } = parseSelectValue(raw);
    const resolvedName = name || bankNameForCode(code, banks) || "";
    setBankCode(code);
    setBankName(resolvedName);
    lastResolved.current = "";
    setResolveMsg(null);
    emit({
      bankCode: code,
      bankName: resolvedName,
      bankAccountName,
      bankAccountNumber,
    });
  };

  const onAccountNumberChange = (raw: string) => {
    const num = raw.replace(/\D/g, "").slice(0, 10);
    setBankAccountNumber(num);
    if (num.length < 10) {
      lastResolved.current = "";
    }
    emit({
      bankCode,
      bankName,
      bankAccountName,
      bankAccountNumber: num,
    });
  };

  const onAccountNameChange = (value: string) => {
    setBankAccountName(value);
    emit({
      bankCode,
      bankName,
      bankAccountName: value,
      bankAccountNumber,
    });
  };

  return {
    banks,
    bankCode,
    bankAccountName,
    bankAccountNumber,
    loadingBanks,
    resolving,
    resolveMsg,
    iso,
    selectVal,
    onSelectBank,
    onAccountNumberChange,
    onAccountNameChange,
  };
}
