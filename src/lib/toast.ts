import { toast } from "sonner";

/**
 * The platform's feedback channel. Use these (not inline banners) for the
 * outcome of an action: a failed submit, a saved setting, a sent code.
 * Field-level validation hints stay inline next to their input.
 *
 * Messages are de-duplicated by text so a repeated failure replaces itself
 * instead of stacking.
 */
export const toastError = (message: string) =>
  toast.error(message, { id: `error:${message}`, duration: 6000 });

export const toastSuccess = (message: string) =>
  toast.success(message, { id: `success:${message}`, duration: 4000 });

export const toastInfo = (message: string) =>
  toast(message, { id: `info:${message}`, duration: 4000 });
