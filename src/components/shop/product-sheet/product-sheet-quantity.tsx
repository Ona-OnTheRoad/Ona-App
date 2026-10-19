import { OnaStepper } from "@/components/ui/ona-stepper";

type Props = {
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
};

export function ProductSheetQuantity({ qty, onDecrement, onIncrement }: Props) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-ona-ctl bg-ona-field px-3 py-2.5">
      <span className="text-[12px] font-semibold text-ona-ink">Quantity</span>
      <OnaStepper
        qty={qty}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
      />
    </div>
  );
}
