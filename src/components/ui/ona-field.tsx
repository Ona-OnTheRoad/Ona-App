"use client";

import {
  Children,
  isValidElement,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { SheetSelect, type SheetOption } from "@/components/ui/option-sheet";
import { cn } from "@/lib/utils";

export const onaControlClass =
  "h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 text-[14px] font-medium text-ona-ink outline-none transition-colors focus:border-ona-ink disabled:opacity-60 aria-[invalid=true]:border-ona-danger";

export const onaLabelClass =
  "mb-1.5 block text-[13px] font-semibold text-ona-ink";

/** Small uppercase section label used on cards (e.g. "ESCROW RELEASE BREAKDOWN"). */
export const onaEyebrowClass =
  "text-[10px] font-bold uppercase tracking-[0.08em] text-ona-muted";

type FieldProps = {
  label: string;
  /** Appends a red asterisk that is hidden from assistive tech (use `required` on the control). */
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: (a: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
};

/**
 * Label + control + hint/error. The label is a real <label for>, and the
 * hint/error are wired through aria-describedby (errors also role="alert").
 */
export function OnaField({
  label,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error || hint;
  return (
    <div className={className}>
      <label htmlFor={id} className={onaLabelClass}>
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-ona-danger">
            *
          </span>
        ) : null}
      </label>
      {children({
        id,
        describedBy: message ? msgId : undefined,
        invalid: Boolean(error),
      })}
      {message ? (
        <p
          id={msgId}
          role={error ? "alert" : undefined}
          className={cn(
            "mt-1.5 text-[12px] font-medium leading-snug",
            error ? "text-ona-danger" : "text-ona-muted",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function OnaInput({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(onaControlClass, className)}
      {...rest}
    />
  );
}

/**
 * Reads `<option>` children (including inside fragments/arrays/optgroups) into sheet options.
 * An empty-value option is the placeholder, not a pickable row.
 */
function optionsFromChildren(children: ReactNode): {
  options: SheetOption[];
  placeholder?: string;
} {
  const options: SheetOption[] = [];
  let placeholder: string | undefined;
  const text = (n: ReactNode): string =>
    Children.toArray(n)
      .map((c) =>
        typeof c === "string" || typeof c === "number" ? String(c) : "",
      )
      .join("");
  const walk = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const props = child.props as {
        value?: string | number;
        disabled?: boolean;
        children?: ReactNode;
      };
      if (child.type === "option") {
        const label = text(props.children);
        const value = props.value != null ? String(props.value) : label;
        if (value === "") placeholder = label || placeholder;
        else options.push({ value, label, disabled: props.disabled });
      } else if (props.children) {
        walk(props.children);
      }
    });
  };
  walk(children);
  return { options, placeholder };
}

/**
 * Select field that opens a bottom sheet (long lists get a search field).
 * Same props as a native `<select>`: `value`, `onChange(e)` with `e.target.value`, `<option>` children.
 */
export function OnaSelect({
  className,
  invalid,
  children,
  wrapperClassName,
  id,
  value,
  onChange,
  disabled,
  options: optionsProp,
  placeholder: placeholderProp,
  triggerLabel,
  searchPlaceholder,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  children?: ReactNode;
  /** Alternative to `<option>` children for wrapped option lists. */
  options?: SheetOption[];
  placeholder?: string;
  /** Compact text for the closed field (e.g. a dial code) instead of the full label. */
  triggerLabel?: (selected: SheetOption) => ReactNode;
  searchPlaceholder?: string;
  invalid?: boolean;
  wrapperClassName?: string;
}) {
  const parsed = optionsFromChildren(children);
  const options = optionsProp ?? parsed.options;
  const placeholder = placeholderProp ?? parsed.placeholder;
  return (
    <SheetSelect
      id={id}
      title={ariaLabel}
      aria-label={ariaLabel}
      triggerLabel={triggerLabel}
      searchPlaceholder={searchPlaceholder}
      value={value == null ? "" : String(value)}
      options={options}
      placeholder={placeholder ?? "Select"}
      disabled={disabled}
      invalid={invalid}
      aria-describedby={describedBy}
      className={className}
      wrapperClassName={wrapperClassName}
      onChange={(v) =>
        onChange?.({
          target: { value: v, id },
          currentTarget: { value: v, id },
        } as unknown as ChangeEvent<HTMLSelectElement>)
      }
    />
  );
}

/** Password input with a show/hide toggle (aria-pressed, named). */
export function OnaPasswordInput({
  className,
  invalid,
  disabled,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...rest}
        disabled={disabled}
        type={visible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn(onaControlClass, "pr-11", className)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-ona-ctl border-0 bg-transparent text-ona-muted disabled:opacity-40"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
