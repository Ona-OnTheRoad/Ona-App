"use client";

import {
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  XCircle,
} from "lucide-react";
import { CallButton } from "@/components/call/in-app-call";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import type { RequestStatus, ServiceRequest } from "@/lib/types";
import { cn, formatDistance, formatEta } from "@/lib/utils";

/** Coarse labels live truth is flow_status on /jobs/[id]; desk maps cloud jobs into RequestStatus. */
const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Service Request / pairing / negotiate",
  accepted: "Booked (paid)",
  en_route: "OnTheRoad",
  arrived: "Arrived",
  in_progress: "Working",
  completed: "Completed / release / paid out",
  cancelled: "Cancelled / expired",
};

export function OrderCard({
  job,
  isLight,
  busy,
  onUpdate,
}: {
  job: ServiceRequest;
  isLight: boolean;
  busy: boolean;
  onUpdate: (id: string, status: RequestStatus) => void;
}) {
  const open = !["completed", "cancelled"].includes(job.status);

  return (
    <article
      className={cn(
        "rounded-xl p-3",
        isLight ? "bg-white shadow-sm" : "bg-white/[0.06]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[13px] font-bold",
              isLight ? "text-slate-900" : "text-white",
            )}
          >
            {job.problem}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {PRO_SERVICE_LABELS[job.serviceType] ?? job.serviceType}
            <span className="mx-1 opacity-40">·</span>
            {STATUS_LABEL[job.status]}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold",
            job.status === "pending"
              ? "bg-amber-100 text-amber-800"
              : job.status === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-brand-soft text-brand",
          )}
        >
          {STATUS_LABEL[job.status]}
        </span>
      </div>

      <div
        className={cn(
          "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]",
          isLight ? "text-slate-600" : "text-white/70",
        )}
      >
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 text-brand" />
          {job.locationLabel}
        </span>
        <span>{formatDistance(job.distanceKm)}</span>
        <span>{formatEta(job.etaMinutes)}</span>
      </div>

      {open && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.status === "pending" && (
            <>
              <Action
                label="Accept"
                icon={CheckCircle2}
                onClick={() => onUpdate(job.id, "accepted")}
                primary
                disabled={busy}
              />
              <Action
                label="Decline"
                icon={XCircle}
                onClick={() => onUpdate(job.id, "cancelled")}
                disabled={busy}
              />
            </>
          )}
          {job.status === "accepted" && (
            <Action
              label="I'm en route"
              icon={Navigation}
              onClick={() => onUpdate(job.id, "en_route")}
              primary
              disabled={busy}
            />
          )}
          {job.status === "en_route" && (
            <Action
              label="Arrived"
              icon={MapPin}
              onClick={() => onUpdate(job.id, "arrived")}
              primary
              disabled={busy}
            />
          )}
          {job.status === "arrived" && (
            <Action
              label="Start work"
              icon={Clock3}
              onClick={() => onUpdate(job.id, "in_progress")}
              primary
              disabled={busy}
            />
          )}
          {job.status === "in_progress" && (
            <Action
              label="Mark complete"
              icon={CheckCircle2}
              onClick={() => onUpdate(job.id, "completed")}
              primary
              disabled={busy}
            />
          )}
          <CallButton
            label="Call motorist"
            target={{
              name: job.technicianName || "Customer",
              phone: "",
              roleLabel: "Customer",
            }}
            className={cn(
              "h-9 flex-none rounded-lg px-3 text-[11px]",
              "bg-black/8 text-slate-800 dark:bg-[#2c2c2e] dark:text-white",
            )}
          />
        </div>
      )}
    </article>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
  primary,
  disabled,
}: {
  label: string;
  icon: typeof CheckCircle2;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border-0 px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50",
        primary
          ? "bg-brand text-white"
          : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/85",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
