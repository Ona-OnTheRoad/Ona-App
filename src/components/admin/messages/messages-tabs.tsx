"use client";

export type MessagesTabKey = "conversations" | "recent" | "reports";

interface MessagesTabsProps {
  activeTab: MessagesTabKey;
  onTabChange: (tab: MessagesTabKey) => void;
  counts: {
    conversations: number;
    messages: number;
    reports: number;
  };
}

export function MessagesTabs({
  activeTab,
  onTabChange,
  counts,
}: MessagesTabsProps) {
  const tabs: { key: MessagesTabKey; label: string }[] = [
    {
      key: "conversations",
      label: `Conversations (${counts.conversations})`,
    },
    {
      key: "recent",
      label: `Recent messages (${counts.messages})`,
    },
    {
      key: "reports",
      label: `Reports & moderation (${counts.reports})`,
    },
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="inline-flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-[#141318] border border-gray-200 dark:border-white/10 text-xs sm:text-sm font-medium shadow-xs min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "text-ona-brand font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

