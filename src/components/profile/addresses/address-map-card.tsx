"use client";

import { AddressLiveMap } from "./address-live-map";

interface AddressMapCardProps {
  pin: { lat: number; lng: number };
  onPinChange: (lat: number, lng: number) => void;
}

export function AddressMapCard({ pin, onPinChange }: AddressMapCardProps) {
  return (
    <div className="relative h-[215px] w-full rounded-2xl overflow-hidden border border-ona-border dark:border-[#333E4F] bg-[#F4F5F7] dark:bg-[#1E222B] shadow-2xs">
      <AddressLiveMap pin={pin} onPinChange={onPinChange} />
    </div>
  );
}
