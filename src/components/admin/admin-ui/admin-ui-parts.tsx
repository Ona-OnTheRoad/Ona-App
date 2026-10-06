"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

export function AdminTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="om-admin-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={cn(
            "om-admin-tab",
            value === t.id && "om-admin-tab-active",
          )}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className="om-admin-tab-count">{t.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="om-admin-detail-grid">{children}</div>;
}

export function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  const empty = value == null || value === "" || value === "" || value === "-";
  return (
    <div className="om-admin-detail-field">
      <div className="om-admin-detail-label">{label}</div>
      <div className="om-admin-detail-value">
        {empty ? <span className="om-admin-empty">Not set</span> : value}
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
  children,
}: {
  status?: string;
  children: ReactNode;
}) {
  const s = (status || "").toLowerCase().replace(/\s+/g, "_");
  // Customer approval colors: Approved green · Pending amber · Rejected red
  const tone =
    s === "approved" ||
    s === "verified" ||
    s === "passed" ||
    s === "active" ||
    s === "online" ||
    s === "full" ||
    s === "t2_approved"
      ? "approved"
      : s === "pending" ||
          s === "submitted" ||
          s === "under_review" ||
          s === "draft" ||
          s === "partial" ||
          s === "partial_/_pending" ||
          s === "unattended"
        ? "pending"
        : s === "rejected" ||
            s === "suspended" ||
            s === "failed" ||
            s === "inactive"
          ? "rejected"
          : s === "none" || s === "no_id" || s === "attended" || s === "read"
            ? "neutral"
            : "";
  return <span className={cn("om-admin-badge", tone)}>{children}</span>;
}

/** Scroll wrapper so wide tables never crush columns */
export function AdminTableWrap({ children }: { children: ReactNode }) {
  return <div className="om-admin-table-scroll">{children}</div>;
}
