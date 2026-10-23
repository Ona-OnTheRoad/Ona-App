import { authLabelClass } from "@/components/auth/auth-plate";
import { passwordChecklist } from "@/lib/signup-validation";
import { cn } from "@/lib/utils";

export function RequiredMark() {
  return (
    <span className="ml-0.5 font-bold text-red-600" aria-label="required">
      *
    </span>
  );
}

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
      <span className={authLabelClass}>
        {label}
        {required && <RequiredMark />}
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

export function PasswordRules({
  password,
  inline,
}: {
  password: string;
  inline?: boolean;
}) {
  const rows = passwordChecklist(password);
  return (
    <ul className={cn("mt-1 space-y-0.5", inline && "mb-0.5")}>
      {rows.map((row) => (
        <li
          key={row.text}
          className={cn(
            "text-[9px] font-medium",
            password.length === 0
              ? "text-[#475569]"
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

export function Row({
  k,
  v,
  isLight = true,
}: {
  k: string;
  v: string;
  isLight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 border-b py-2.5 last:border-0",
        isLight ? "border-black/[0.06]" : "border-white/10",
      )}
    >
      <span
        className={cn(
          "w-28 shrink-0 font-semibold",
          isLight ? "text-[#86868b]" : "text-white/60",
        )}
      >
        {k}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 font-semibold break-words",
          isLight ? "text-[#1d1d1f]" : "text-white",
        )}
      >
        {v}
      </span>
    </div>
  );
}
