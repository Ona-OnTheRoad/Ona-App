"use client";

interface OnaToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function OnaToggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: OnaToggleProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-50"
      style={{
        backgroundColor: checked ? "var(--brand, #ff6b35)" : "#cbd5e1",
        border: checked ? "1px solid var(--brand, #ff6b35)" : "1px solid #94a3b8",
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transition-transform duration-200 ease-in-out"
        style={{
          backgroundColor: "#ffffff",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}
