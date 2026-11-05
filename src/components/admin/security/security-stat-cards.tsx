"use client";

interface SecurityStatCardsProps {
  stats: Record<string, string | number | undefined>;
}

export function SecurityStatCards({ stats }: SecurityStatCardsProps) {
  const cards = [
    {
      label: "TOTAL CONTACT CHANGES",
      value: stats.totalChangeRequests ?? 0,
    },
    {
      label: "PENDING CHANGES",
      value: stats.pendingChangeRequests ?? 0,
    },
    {
      label: "OPEN FRAUD FLAGS",
      value: stats.openFraudFlags ?? 0,
    },
    {
      label: "AUDIT EVENTS TODAY",
      value: stats.auditEventsToday ?? 0,
    },
    {
      label: "ACTIVE SESSIONS",
      value: stats.activeSessions ?? 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
            {c.label}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}

