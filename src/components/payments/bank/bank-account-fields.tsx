"use client";

interface BankAccountFieldsProps {
  accountNumber: string;
  onAccountNumberChange: (num: string) => void;
  accountName: string;
  onAccountNameChange: (name: string) => void;
  resolving: boolean;
  resolveMsg: string | null;
  bankCode: string;
}

export function BankAccountFields({
  accountNumber,
  onAccountNumberChange,
  accountName,
  onAccountNameChange,
  resolving,
  resolveMsg,
  bankCode,
}: BankAccountFieldsProps) {
  const isVerified =
    resolveMsg === "Name verified" ||
    (resolveMsg != null && resolveMsg.toLowerCase().includes("verified"));

  return (
    <div className="space-y-4">
      {/* Account number (10 DIGITS) */}
      <div className="space-y-1.5">
        <label
          htmlFor="bank-account-number"
          className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ona-ink"
        >
          Account number (10 DIGITS)
        </label>
        <input
          id="bank-account-number"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          autoComplete="off"
          placeholder="0123456789"
          value={accountNumber}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
            onAccountNumberChange(digits);
          }}
          className="h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 text-[13px] font-medium text-ona-ink outline-none focus:outline-none focus:ring-0 transition-colors focus:border-ona-ink"
        />
      </div>

      {/* Account name */}
      <div className="space-y-1.5">
        <label
          htmlFor="bank-account-name"
          className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ona-ink"
        >
          Account name{" "}
          {resolving ? (
            <span className="font-semibold text-brand normal-case">
              . Looking up ...
            </span>
          ) : null}
        </label>
        <input
          id="bank-account-name"
          type="text"
          autoComplete="off"
          value={accountName}
          onChange={(e) => onAccountNameChange(e.target.value)}
          placeholder={
            bankCode && accountNumber.length === 10
              ? "Resolving account name..."
              : "Select bank + enter number to auto-fill"
          }
          readOnly={resolving}
          className={`h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 text-[13px] font-medium text-ona-ink outline-none focus:outline-none focus:ring-0 transition-colors focus:border-ona-ink ${
            resolving ? "opacity-75" : ""
          }`}
        />
        {resolveMsg ? (
          <p
            className={`text-[12px] font-semibold pt-0.5 ${
              isVerified ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            }`}
          >
            {resolveMsg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
