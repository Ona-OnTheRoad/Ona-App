"use client";

interface ProsStatCardsProps {
  totalPros: number;
  needsAction: number;
  t2Pending: number;
  t4Pending: number;
}

export function ProsStatCards({
  totalPros,
  needsAction,
  t2Pending,
  t4Pending,
}: ProsStatCardsProps) {
  const cards = [
    { label: "REPAIR PROS", value: totalPros },
    { label: "PRO NEEDS ACTION", value: needsAction },
    { label: "PRO T2 PENDING", value: t2Pending },
    { label: "PRO T4 PENDING", value: t4Pending },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
            {c.label}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {c.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

