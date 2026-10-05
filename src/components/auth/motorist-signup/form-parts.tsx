import { passwordRules } from "@/lib/signup-validation";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-semibold text-[#475569]">
        {label}
        {required && (
          <span className="ml-0.5 font-bold text-red-600" aria-label="required">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export function FieldHint({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-0.5 text-[10px] font-medium leading-snug text-red-600"
      role="alert"
    >
      {message}
    </p>
  );
}

export function PasswordRules({ password }: { password: string }) {
  const r = passwordRules(password);
  const rows: { ok: boolean; text: string }[] = [
    { ok: r.length, text: "At least 8 characters" },
    { ok: r.upper, text: "At least 1 capital letter" },
    { ok: r.digit, text: "At least 1 number" },
    { ok: true, text: "You can add symbols if you want" },
  ];
  return (
    <ul className="mt-1 space-y-0.5">
      {rows.map((row) => (
        <li
          key={row.text}
          className={cn(
            "text-[9px] font-medium",
            password.length === 0
              ? "text-[#64748b]"
              : row.ok
                ? "text-emerald-600"
                : "text-red-600",
          )}
        >
          {row.ok && password.length > 0 ? "✓ " : "· "}
          {row.text}
        </li>
      ))}
    </ul>
  );
}
