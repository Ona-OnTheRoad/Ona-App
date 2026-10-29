"use client";

interface BankActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

export function BankActionButtons({
  onCancel,
  onSave,
  isSaving,
  disabled,
}: BankActionButtonsProps) {
  return (
    <div className="flex items-center gap-3 pt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="h-12 flex-1 rounded-ona-ctl border border-ona-border bg-ona-surface dark:bg-ona-field text-[14px] font-bold text-ona-ink dark:text-ona-muted transition-colors hover:bg-ona-field active:opacity-80 disabled:opacity-50 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || disabled}
        className="h-12 flex-1 rounded-ona-ctl bg-brand dark:bg-ona-brand text-[14px] font-bold text-white transition-opacity hover:opacity-95 active:opacity-80 disabled:opacity-50 cursor-pointer"
      >
        {isSaving ? "Saving..." : "Save bank"}
      </button>
    </div>
  );
}
