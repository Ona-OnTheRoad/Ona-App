"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

interface RecentMessagesTabProps {
  messages: MessageRow[];
}

export function RecentMessagesTab({ messages }: RecentMessagesTabProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent messages
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <th className="px-6 py-3.5 w-1/4">When</th>
              <th className="px-6 py-3.5 w-3/4">Body</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                      No messages yet.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              messages.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-800 dark:text-gray-200 break-words">
                    {m.body}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

