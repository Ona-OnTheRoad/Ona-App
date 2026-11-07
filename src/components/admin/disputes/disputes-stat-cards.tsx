"use client";

interface DisputesStatCardsProps {
  disputed: number;
  underAppeal: number;
  openQueue: number;
}

export function DisputesStatCards({
  disputed,
  underAppeal,
  openQueue,
}: DisputesStatCardsProps) {
  const cards = [
    {
      label: "DISPUTED",
      value: disputed.toString(),
    },
    {
      label: "UNDER APPEAL",
      value: underAppeal.toString(),
    },
    {
      label: "OPEN QUEUE",
      value: openQueue.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[#f8f9fa] dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-xl p-3.5 sm:p-4 hover:border-gray-300 dark:hover:border-[#383842] transition-colors"
        >
          <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
            {c.label}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

