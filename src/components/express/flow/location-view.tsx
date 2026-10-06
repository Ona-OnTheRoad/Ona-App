import { AddressAutocomplete } from "@/components/map/address-autocomplete";
import type { PickedLocation } from "@/components/map/location-picker-map";
import { cn } from "@/lib/utils";
import type { ExpressTheme } from "./types";

type Props = {
  theme: ExpressTheme;
  value: PickedLocation | null;
  onChange: (picked: PickedLocation | null) => void;
};

export function LocationView({ theme, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <AddressAutocomplete value={value} onChange={onChange} />
      <p className={cn("px-1 text-[11px] font-medium", theme.muted)}>
        Call-out is charged on the real road-route distance at ₦350/km.
      </p>
    </div>
  );
}
