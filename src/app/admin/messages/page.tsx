"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { toastError } from "@/lib/toast";
import {
  MessagesTabs,
  type MessagesTabKey,
} from "@/components/admin/messages/messages-tabs";
import {
  ConversationsTab,
  type ConversationRow,
} from "@/components/admin/messages/conversations-tab";
import {
  RecentMessagesTab,
  type MessageRow,
} from "@/components/admin/messages/recent-messages-tab";
import {
  ReportsTab,
  type MessageReportRow,
} from "@/components/admin/messages/reports-tab";
import { Loader2 } from "lucide-react";

export default function AdminMessagesPage() {
  const { adminName, ready, api } = useAdminGate();
  const [activeTab, setActiveTab] = useState<MessagesTabKey>("conversations");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reports, setReports] = useState<MessageReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      const res = await api<{
        conversations: ConversationRow[];
        messages: MessageRow[];
        reports?: MessageReportRow[];
      }>("/api/admin/messages");

      if (cancelled) return;
      if (!res.ok) {
        toastError(res.message);
        setLoading(false);
        return;
      }

      setConversations(res.data.conversations || []);
      setMessages(res.data.messages || []);
      setReports(res.data.reports || []);
      setLoading(false);
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [ready, api]);

  async function handleModerate(action: string, id: string) {
    setModeratingId(id);
    const res = await api<{ id: string; status?: string }>(
      "/api/admin/messages",
      { method: "POST", body: JSON.stringify({ action, id }) },
    );

    if (!res.ok) {
      toastError(res.message);
      setModeratingId(null);
      return;
    }

    // Refresh data
    const fresh = await api<{
      conversations: ConversationRow[];
      messages: MessageRow[];
      reports?: MessageReportRow[];
    }>("/api/admin/messages");

    if (fresh.ok) {
      setConversations(fresh.data.conversations || []);
      setMessages(fresh.data.messages || []);
      setReports(fresh.data.reports || []);
    }
    setModeratingId(null);
  }

  return (
    <AdminShell
      adminName={adminName}
      title="Messages"
      subtitle="Customer-pro chats and dispute logs"
      guideKey="messages"
    >
      <div className="w-full pb-16">
        {/* Tab Navigation */}
        <div className="mb-6">
          <MessagesTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              conversations: conversations.length,
              messages: messages.length,
              reports: reports.length,
            }}
          />
        </div>

        {/* Loading state to eliminate empty-state flash */}
        {!ready || loading ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-ona-brand mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading messages...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === "conversations" && (
              <ConversationsTab conversations={conversations} />
            )}
            {activeTab === "recent" && (
              <RecentMessagesTab messages={messages} />
            )}
            {activeTab === "reports" && (
              <ReportsTab
                reports={reports}
                onModerate={handleModerate}
                moderatingId={moderatingId}
              />
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
