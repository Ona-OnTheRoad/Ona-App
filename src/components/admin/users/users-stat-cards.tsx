"use client";

interface UsersStatCardsProps {
  customersCount: number;
  customerT2Pending: number;
  prosCount: number;
  proNeedsAction: number;
  proT2Pending: number;
  proT4Pending: number;
}

export function UsersStatCards({
  customersCount,
  customerT2Pending,
  prosCount,
  proNeedsAction,
  proT2Pending,
  proT4Pending,
}: UsersStatCardsProps) {
  const cards = [
    {
      label: "CUSTOMERS",
      value: customersCount,
      sub: "motorist side only",
    },
    {
      label: "CUSTOMER T2 PENDING",
      value: customerT2Pending,
      sub: "t2 kyc queue",
    },
    {
      label: "REPAIR PROS",
      value: prosCount,
      sub: "pro accounts",
    },
    {
      label: "PRO NEEDS ACTION",
      value: proNeedsAction,
      sub: "review required",
    },
    {
      label: "PRO T2 PENDING",
      value: proT2Pending,
      sub: "id submitted",
    },
    {
      label: "PRO T4 PENDING",
      value: proT4Pending,
      sub: "docs review",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
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
          <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 select-none truncate">
            {c.sub}
          </span>
        </div>
      ))}
    </div>
  );
}

