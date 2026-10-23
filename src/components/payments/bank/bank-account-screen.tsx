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

  const [details, setDetails] = useState<BankDetailsValue>({
    bankCode: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

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
    const e = updateUserProfile({
      bankCode: code,
      bankName: details.bankName.trim(),
      bankAccountName: bankAccountName.trim(),
      bankAccountNumber: num,
    });
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
          if (userProfile) {
            setDetails({
              bankCode: userProfile.bankCode || "",
              bankName: userProfile.bankName || "",
              bankAccountName: userProfile.bankAccountName || "",
              bankAccountNumber: userProfile.bankAccountNumber || "",
            });
          }
        }}
      />
    </div>
  );
}
