"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import {
  checkBankAccountAvailable,
  hasCompleteBankDetails,
  validateBankDetailsInput,
} from "@/lib/bank-details";
import { useBankDetailsFields } from "@/components/auth/bank-details-fields/use-bank-details-fields";
import type { BankDetailsValue } from "@/components/auth/bank-details-fields/types";
import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";
import { BankVerifyPanel } from "@/components/profile/security/shared/bank-verify-panel";
import { changeBankAccount } from "@/lib/security/change-bank-client";
import { PaymentsScreenHeader } from "../payments-screen-header";
import { BankSelectDropdown } from "./bank-select-dropdown";
import { BankAccountFields } from "./bank-account-fields";
import { BankActionButtons } from "./bank-action-buttons";
import { BankSavedCard } from "./bank-saved-card";

export function BankAccountScreen() {
  const router = useRouter();
  const { theme, userProfile, updateUserProfile, accountType } = useApp();
  const isLight = theme === "light";
  const isPro = accountType === "professional";

  // Start from the saved bank so a saved account shows its card (Edit -> verify -> change)
  // instead of dropping every returning user straight into the edit form.
  const [details, setDetails] = useState<BankDetailsValue>({
    bankCode: userProfile?.bankCode || "",
    bankName: userProfile?.bankName || "",
    bankAccountName: userProfile?.bankAccountName || "",
    bankAccountNumber: userProfile?.bankAccountNumber || "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  /** Server-issued proof that the code sent to the account's phone was entered (needed to CHANGE a saved bank). */
  const [bankProof, setBankProof] = useState("");

  useEffect(() => {
    if (!userProfile) return;
    setDetails({
      bankCode: userProfile.bankCode || "",
      bankName: userProfile.bankName || "",
      bankAccountName: userProfile.bankAccountName || "",
      bankAccountNumber: userProfile.bankAccountNumber || "",
    });
  }, [userProfile]);

  const complete = hasCompleteBankDetails({
    ...userProfile!,
    bankCode: details.bankCode,
    bankName: details.bankName,
    bankAccountName: details.bankAccountName,
    bankAccountNumber: details.bankAccountNumber,
  } as NonNullable<typeof userProfile>);

  useEffect(() => {
    if (!complete) {
      setEditing(true);
    }
  }, [complete]);

  const {
    banks,
    bankCode,
    bankAccountName,
    bankAccountNumber,
    loadingBanks,
    resolving,
    resolveMsg,
    selectVal,
    onSelectBank,
    onAccountNumberChange,
    onAccountNameChange,
  } = useBankDetailsFields({
    initial: details,
    onChange: setDetails,
    signupFullName: userProfile?.fullName,
    countryIso: userProfile?.identityCountryIso || "NG",
  });

  // A bank account already saved on this account can only be changed after verification.
  const onFile = hasCompleteBankDetails(userProfile);

  const resetToSaved = () => {
    setBankProof("");
    if (userProfile) {
      setDetails({
        bankCode: userProfile.bankCode || "",
        bankName: userProfile.bankName || "",
        bankAccountName: userProfile.bankAccountName || "",
        bankAccountNumber: userProfile.bankAccountNumber || "",
      });
    }
  };

  const handleBack = () => {
    navigateBack(router, "/settings/payments", accountType);
  };

  const handleSave = async () => {
    setErr(null);
    setMsg(null);
    const num = bankAccountNumber.replace(/\D/g, "").slice(0, 10);
    const code = bankCode.trim();
    const validation = validateBankDetailsInput(
      {
        ...details,
        bankAccountNumber: num,
        bankCode: code,
        bankAccountName,
      },
      undefined,
      userProfile?.fullName,
    );
    if (validation) {
      setErr(validation);
      return;
    }
    setBusy(true);
    const uniq = await checkBankAccountAvailable({
      bankCode: code,
      accountNumber: num,
    });
    if (!uniq.ok) {
      setBusy(false);
      setErr(uniq.error);
      return;
    }
    const next = {
      bankCode: code,
      bankName: details.bankName.trim(),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: num,
    };

    // Changing a saved account goes through the verified path; the server rejects
    // the generic profile save for a different account.
    if (onFile) {
      const { ensureAppSession } = await import("@/lib/supabase/session");
      const session = await ensureAppSession().catch(() => null);
      if (!session?.accessToken) {
        setBusy(false);
        setErr("Your session expired. Please sign in again.");
        return;
      }
      const res = await changeBankAccount({
        accessToken: session.accessToken,
        bank: next,
        bankProof,
      });
      if (!res.ok) {
        setBusy(false);
        if (res.code === "verification_required") setBankProof("");
        setErr(res.error);
        return;
      }
      setBankProof("");
    }

    const e = updateUserProfile(next);
    setBusy(false);
    if (e) {
      setErr(e);
    } else {
      setMsg("Bank saved successfully.");
      setEditing(false);
    }
  };

  const handleCancelClick = () => {
    if (complete) {
      setConfirmCancel(true);
    } else {
      handleBack();
    }
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-5">
        <PaymentsScreenHeader
          title="Bank account details"
          onBack={handleBack}
        />

        {err ? (
          <div className="rounded-ona-ctl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-3 text-center text-[13px] font-semibold text-red-600 dark:text-red-400">
            {err}
          </div>
        ) : null}

        {complete && !editing ? (
          <BankSavedCard
            bankName={details.bankName}
            bankAccountNumber={details.bankAccountNumber}
            bankAccountName={details.bankAccountName}
            isPro={isPro}
            onEdit={() => {
              setEditing(true);
              setMsg(null);
              setErr(null);
            }}
          />
        ) : onFile && !bankProof ? (
          <BankVerifyPanel
            isLight={isLight}
            onVerified={setBankProof}
            onCancel={() => {
              setEditing(false);
              setErr(null);
              setMsg(null);
              resetToSaved();
            }}
          />
        ) : (
          <div className="space-y-4">
            <BankSelectDropdown
              banks={banks}
              value={selectVal}
              onChange={onSelectBank}
              loading={loadingBanks}
              bankCode={bankCode}
              countryIso={userProfile?.identityCountryIso || "NG"}
            />

            <BankAccountFields
              accountNumber={bankAccountNumber}
              onAccountNumberChange={onAccountNumberChange}
              accountName={bankAccountName}
              onAccountNameChange={onAccountNameChange}
              resolving={resolving}
              resolveMsg={resolveMsg}
              bankCode={bankCode}
            />

            <BankActionButtons
              onCancel={handleCancelClick}
              onSave={() => void handleSave()}
              isSaving={busy}
              disabled={loadingBanks || !bankCode || bankAccountNumber.length !== 10}
            />
          </div>
        )}
      </div>

      <ConfirmCancelSheet
        open={confirmCancel}
        isLight={isLight}
        title="Discard changes?"
        message="Your bank details will not be saved."
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          setEditing(false);
          setErr(null);
          setMsg(null);
          resetToSaved();
        }}
      />
    </div>
  );
}
