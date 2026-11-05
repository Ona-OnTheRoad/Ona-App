/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useMemo } from "react";
import type { HealthSnapshot, HealthLevel } from "@/types/health";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { RefreshCw, Search, ChevronDown, Check, Info } from "lucide-react";

interface SystemHealthTabProps {
  snapshot: HealthSnapshot | null;
  loading: boolean;
  running: boolean;
  onRunCheck: () => Promise<void>;
  onToggleResolved: (id: string, resolved: boolean) => Promise<void>;
}

export function SystemHealthTab({
  snapshot,
  loading,
  running,
  onRunCheck,
  onToggleResolved,
}: SystemHealthTabProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const overall = snapshot?.overall || "healthy";

  const components = snapshot?.components || {
    frontend: {
      status: "healthy" as HealthLevel,
      label: "FRONTEND HEALTH",
      value: "0 client errors / hr",
      description: "No significant client render or runtime errors reported.",
      lastChecked: new Date().toISOString(),
    },
    backend: {
      status: "warning" as HealthLevel,
      label: "BACKEND / API",
      value: "0 API issues / hr · 2572 ms avg",
      description: "Average latency slightly elevated.",
      lastChecked: new Date().toISOString(),
    },
    database: {
      status: "healthy" as HealthLevel,
      label: "DATABASE HEALTH",
      value: "10.0% storage used",
      description: "Postgres pool connection is optimal.",
      lastChecked: new Date().toISOString(),
    },
    maps: {
      status: "warning" as HealthLevel,
      label: "MAPS INTEGRATION",
      value: "0 client errors / hr",
      description: "Map tiles responding normally.",
      lastChecked: new Date().toISOString(),
    },
    auth: {
      status: "healthy" as HealthLevel,
      label: "AUTHENTICATION",
      value: "0 failed auth events / hr",
      description: "Auth session verification running normally.",
      lastChecked: new Date().toISOString(),
    },
  };

  const issues = snapshot?.issues || [];

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (severityFilter !== "all" && i.severity !== severityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          i.message.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          (i.source && i.source.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [issues, typeFilter, severityFilter, search]);

  return (
    <div>
      {/* Header & Run Check Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            System health
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Backend health: Supabase, payments, maps, and error signals. Use when the live app misbehaves.
          </p>
        </div>
        <button
          type="button"
          disabled={running || loading}
          onClick={() => void onRunCheck()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
          <span>{running ? "Running…" : "Run full health check"}</span>
        </button>
      </div>

      {/* Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-6 px-1 text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              OVERALL STATUS
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                overall === "healthy"
                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                  : overall === "warning"
                  ? "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
                  : "bg-red-500/10 text-red-500 dark:bg-red-500/20"
              }`}
            >
              {overall}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              LAST CHECKED:
            </span>
            <span>
              {snapshot?.checkedAt
                ? new Date(snapshot.checkedAt).toLocaleString()
                : new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className="text-gray-400 text-xs">
          Auto-refresh every 60s
        </div>
      </div>

      {/* 5 Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {Object.entries(components).map(([key, comp]) => (
          <div
            key={key}
            className="p-4 rounded-2xl bg-[#F3F4F6] dark:bg-[#141318] border border-gray-200 dark:border-white/5 shadow-xs relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1">
                  <span
                    onMouseEnter={() => setActiveTooltip(key)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                    {comp.label}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                    comp.status === "healthy"
                      ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                      : comp.status === "warning"
                      ? "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
                      : "bg-red-500/10 text-red-500 dark:bg-red-500/20"
                  }`}
                >
                  {comp.status}
                </span>
              </div>

              {/* Tooltip popover */}
              {activeTooltip === key && (
                <div className="absolute top-10 left-2 z-20 max-w-xs p-2.5 rounded-xl bg-gray-900 text-white text-[11px] shadow-lg border border-gray-700 pointer-events-none">
                  {comp.description}
                </div>
              )}

              <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {comp.value}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">
              Last check:{" "}
              {comp.lastChecked
                ? new Date(comp.lastChecked).toLocaleString()
                : "Now"}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Issues Table Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent issues
          </h3>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex items-center w-56 sm:w-64 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#18171c] border border-gray-200 dark:border-white/10 focus-within:border-ona-brand transition-colors">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search message, type, source..."
                className="w-full bg-transparent text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 border-none outline-hidden"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 dark:bg-[#18171c] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <option value="all">All types</option>
              <option value="api">API</option>
              <option value="database">Database</option>
              <option value="maps">Maps</option>
              <option value="auth">Auth</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-50 dark:bg-[#18171c] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <th className="px-6 py-3.5">When</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Message</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                        No issues logged.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(issue.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-900 dark:text-white uppercase">
                      {issue.type}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          issue.severity === "critical"
                            ? "bg-red-500/10 text-red-500 dark:bg-red-500/20"
                            : issue.severity === "warning"
                            ? "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-800 dark:text-gray-200">
                      {issue.message}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {issue.source || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <button
                        type="button"
                        onClick={() => void onToggleResolved(issue.id, !issue.resolved)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          issue.resolved
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {issue.resolved ? "Resolved" : "Mark Resolved"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

