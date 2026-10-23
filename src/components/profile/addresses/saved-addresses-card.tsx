"use client";

export interface SavedAddressItem {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  isActive?: boolean;
}

interface SavedAddressesCardProps {
  addresses: SavedAddressItem[];
  activeId: string | null;
  onUse: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedAddressesCard({
  addresses,
  activeId,
  onUse,
  onDelete,
}: SavedAddressesCardProps) {
  return (
    <div className="rounded-2xl border border-ona-border bg-ona-surface p-4.5 shadow-2xs">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-2">
        SAVED ADDRESSES
      </p>

      {addresses.length === 0 ? (
        <p className="text-[12px] font-normal text-ona-muted py-3">
          No saved addresses yet. Pick a location and tap &ldquo;Save labeled address&rdquo;.
        </p>
      ) : (
        <div className="divide-y divide-ona-border/60">
          {addresses.map((item) => {
            const isActive = item.id === activeId || item.isActive;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-1"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-[13px] font-medium text-ona-ink">
                    {item.label}
                  </p>
                  <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                    {item.address}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 shrink-0">
                  {isActive ? (
                    <span className="px-3 py-1 rounded-full bg-[#FFD3C4] text-[#E85A28] dark:bg-brand/20 dark:text-brand font-medium text-[11px]">
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUse(item.id)}
                      className="px-3.5 py-1 rounded-md bg-[#F05A30] text-white font-medium text-[11px] hover:bg-[#E04F24] active:scale-95 transition-all cursor-pointer"
                    >
                      Use
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-[#C70036] font-medium text-[12px] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
