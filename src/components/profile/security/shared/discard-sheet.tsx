import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";

export function DiscardChangesSheet({
  open,
  isLight,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmCancelSheet
      open={open}
      isLight={isLight}
      title="Discard changes?"
      message="Any changes you've made will be lost."
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
