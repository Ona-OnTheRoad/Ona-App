export type PickedLocation = {
  lat: number;
  lng: number;
  label: string;
  city: string;
  area: string;
};

export type LocationPickerProps = {
  value?: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  className?: string;
  /** Shorter map for home sheet / compact panels */
  compact?: boolean;
};
