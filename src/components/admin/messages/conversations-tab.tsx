"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import Link from "next/link";

export type ConversationRow = {
  id: string;
  motorist_id: string;
  repair_pro_id: string;
  request_id: string | null;
  last_message_at: string | null;
  created_at: string;
};

interface ConversationsTabProps {
  conversations: ConversationRow[];
}

export function ConversationsTab({ conversations }: ConversationsTabProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Conversations
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <th className="px-6 py-3.5 w-1/3">Created</th>
              <th className="px-6 py-3.5 w-1/3">Customer</th>
              <th className="px-6 py-3.5 w-1/3">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {conversations.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                      No conversations yet.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              conversations.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                    {new Date(c.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-900 dark:text-gray-200">
                    <Link
                      href={`/admin/motorists/${c.motorist_id}`}
                      className="text-ona-brand hover:underline"
                    >
                      {c.motorist_id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                    {c.repair_pro_id.slice(0, 8)}…
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

