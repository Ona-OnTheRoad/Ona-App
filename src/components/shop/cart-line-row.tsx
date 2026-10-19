import { OnaStepper } from "@/components/ui/ona-stepper";

type Props = {
  name: string;
  sku: string;
  priceLabel: string;
  qty: number;
  inStock: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
};

/** One cart line (shared by the cart page and the cart sheet). */
export function CartLineRow({
  name,
  sku,
  priceLabel,
  qty,
  inStock,
  onDecrement,
  onIncrement,
}: Props) {
  return (
    <div className="rounded-ona-card bg-ona-field p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-ona-ink">
            {name}
          </p>
          <p className="mt-0.5 text-[10px] uppercase text-ona-muted">{sku}</p>
          <p className="mt-1.5 text-[13px] font-semibold tabular-nums text-ona-brand-ink">
            {priceLabel}
          </p>
        </div>
        <OnaStepper
          qty={qty}
          removeAtOne
          disableIncrement={!inStock}
          onDecrement={onDecrement}
          onIncrement={onIncrement}
        />
      </div>
      {!inStock ? (
        <p
          role="alert"
          className="mt-1.5 text-[11px] font-semibold text-ona-danger"
        >
          Stock issue, reduce qty or remove
        </p>
      ) : null}
    </div>
  );
}
