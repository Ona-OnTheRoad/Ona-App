import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/30 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] border-0",
  {
    variants: {
      variant: {
        default: "metallic-orange text-white",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-md",
        outline: "bg-white text-slate-800 hover:bg-slate-50 rounded-md",
        ghost: "hover:bg-slate-100 text-slate-700 rounded-md",
        danger: "bg-red-500 text-white hover:bg-red-600 rounded-md",
        soft: "bg-brand-soft text-brand hover:bg-orange-100 rounded-md",
        navy: "bg-black text-slate-100 rounded-md",
        /* Ona v2 (redesigned screens, inside `.ona2`) */
        ona: "bg-ona-brand-btn text-white active:bg-ona-brand-press disabled:bg-ona-disabled-bg disabled:text-ona-disabled-ink disabled:opacity-100",
        onaOutline:
          "border border-ona-border bg-ona-surface text-ona-ink active:bg-ona-field",
        onaDark: "bg-ona-dark text-white active:bg-ona-dark-2",
        onaGhost: "bg-transparent text-ona-ink active:bg-ona-field",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-5 text-[15px]",
        icon: "h-9 w-9",
        ona: "h-12 w-full rounded-ona-ctl px-4 text-[15px] leading-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Blocks taps and shows `busyLabel` (or children) while true. */
  busy?: boolean;
  busyLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      busy,
      busyLabel,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          busy && "cursor-wait",
        )}
        ref={ref}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        {...props}
      >
        {busy && busyLabel ? busyLabel : children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
