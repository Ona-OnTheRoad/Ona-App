"use client";

interface AccountsStatCardsProps {
  motoristOnly: number;
  proOnly: number;
  dual: number;
  needsSync: number;
  pendingMerges: number;
}

export function AccountsStatCards({
  motoristOnly,
  proOnly,
  dual,
  needsSync,
  pendingMerges,
}: AccountsStatCardsProps) {
  const cards = [
    {
      label: "CUSTOMER ONLY",
      value: motoristOnly,
      sub: "motorist side only",
    },
    {
      label: "REPAIR PRO ONLY",
      value: proOnly,
      sub: "pro side only",
    },
    {
      label: "BOTH ROLES",
      value: dual,
      sub: "pro has the request",
    },
    {
      label: "NEEDS SYNC",
      value: needsSync,
      sub: "role registry mismatch",
    },
    {
      label: "PENDING MERGES",
      value: pendingMerges,
      sub: "duplicate identities",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
              {c.label}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
              {c.value.toLocaleString()}
            </div>
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 select-none">
            {c.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

