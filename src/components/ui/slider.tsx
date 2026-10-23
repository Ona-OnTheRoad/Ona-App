"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * shadcn Slider (Radix) in the Ona look: coral fill on a gray track with a white
 * thumb. Pass `aria-label` (and `getAriaValueText` on the thumb via `thumbLabel`)
 * so assistive tech reads the value.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    /** Accessible name for the thumb when there is a single value. */
    thumbLabel?: string;
    /** Formats the single value for aria-valuetext (e.g. a ₦ amount). */
    getAriaValueText?: (value: number) => string;
  }
>(({ className, thumbLabel, getAriaValueText, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-6 w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-ona-border">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-ona-brand" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={thumbLabel}
      aria-valuetext={
        getAriaValueText && props.value?.length === 1
          ? getAriaValueText(props.value[0])
          : undefined
      }
      className="block h-6 w-6 rounded-full border border-ona-border bg-white shadow-md outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ona-brand disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

export { Slider };
