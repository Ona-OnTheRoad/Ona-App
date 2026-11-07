"use client";

export type SettingsTabKey =
  | "health"
  | "staff"
  | "app"
  | "features"
  | "services"
  | "matching"
  | "content";

interface SettingsTabsProps {
  activeTab: SettingsTabKey;
  onTabChange: (tab: SettingsTabKey) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const tabs: { key: SettingsTabKey; label: string }[] = [
    { key: "health", label: "System health" },
    { key: "staff", label: "Staff levels" },
    { key: "app", label: "App settings" },
    { key: "features", label: "Feature flags" },
    { key: "services", label: "Services catalog" },
    { key: "matching", label: "Map & matching" },
    { key: "content", label: "Content & menus" },
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar mb-6">
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

