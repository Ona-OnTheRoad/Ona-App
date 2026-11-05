"use client";

interface CustomersStatCardsProps {
  totalCustomers: number;
  t2Pending: number;
}

export function CustomersStatCards({
  totalCustomers,
  t2Pending,
}: CustomersStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#F3F4F6] dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
          CUSTOMERS
        </span>
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {totalCustomers}
        </span>
      </div>

      <div className="bg-[#F3F4F6] dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase select-none">
          CUSTOMER T2 PENDING
        </span>
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
          {t2Pending}
        </span>
      </div>
    </div>
  );
}

