"use client";

interface SignupsStatCardsProps {
  shown: number;
  succeeded: number;
  failed: number;
}

export function SignupsStatCards({
  shown,
  succeeded,
  failed,
}: SignupsStatCardsProps) {
  const cards = [
    { label: "SHOWN", value: shown },
    { label: "SUCCEEDED", value: succeeded },
    { label: "FAILED", value: failed },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="p-5 rounded-2xl bg-white dark:bg-[#141318] border border-gray-200 dark:border-white/5 shadow-xs"
        >
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            {c.label}
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {c.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

