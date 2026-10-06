import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import {
  clearJobShown,
  requestForceIncomingPanel,
} from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import { meetAddress } from "@/components/jobs-list/job-location";
import { cn } from "@/lib/utils";
import { ongoingStatusLabel, splitPlaceAndArea } from "./dashboard-helpers";

type Tone = { ink: string; muted: string };

export function IncomingSection({
  incoming,
  backendUserId,
  ink,
  muted,
}: {
  incoming: JobRecord[];
  backendUserId: string | null | undefined;
} & Tone) {
  const router = useRouter();
  return (
    <section>
      <p
        className={cn(
          "mb-1 text-[11px] font-black uppercase tracking-[0.12em]",
          muted,
        )}
      >
        Incoming requests
      </p>
      <ul className="space-y-0">
        {incoming.map((j) => {
          return (
            <li key={j.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 border-0 bg-transparent py-3.5 text-left active:opacity-90"
                onClick={() => {
                  clearJobShown(j.id, backendUserId || undefined);
                  requestForceIncomingPanel(j.id);
                  // Stay on dashboard lower panel only (no full /jobs page)
                  router.replace("/dashboard");
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[15px] font-semibold", ink)}>
                    {isAutomotiveTrade(j.serviceType) &&
                    j.motoristVehicle?.trim()
                      ? j.motoristVehicle.trim()
                      : PRO_SERVICE_LABELS[j.serviceType] || "Service Request"}
                  </p>
                </div>
                <ChevronRight className={cn("h-4 w-4 shrink-0 mr-4", muted)} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function OngoingSection({
  ongoing,
  ink,
  muted,
}: { ongoing: JobRecord[] } & Tone) {
  return (
    <section>
      <p
        className={cn(
          "mb-1 text-[11px] font-black uppercase tracking-[0.12em]",
          muted,
        )}
      >
        Ongoing jobs
      </p>
      <ul className="space-y-0">
        {ongoing.map((j) => {
          const addr = meetAddress(j);
          return (
            <li key={j.id}>
              <Link
                href={`/jobs/${j.id}`}
                className="flex items-center gap-3 border-0 bg-transparent py-3.5 active:opacity-90"
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[15px] font-semibold", ink)}>
                    {isAutomotiveTrade(j.serviceType) &&
                    j.motoristVehicle?.trim()
                      ? j.motoristVehicle.trim()
                      : PRO_SERVICE_LABELS[j.serviceType] || "Job"}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[11px] font-bold text-[#FF6B35]",
                    )}
                  >
                    {ongoingStatusLabel(j.status)}
                  </p>
                  {addr ? (
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[12px] font-medium",
                        muted,
                      )}
                    >
                      {addr}
                    </p>
                  ) : null}
                </div>
                <ChevronRight className={cn("h-4 w-4 shrink-0", muted)} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PayoutProcessingSection({
  payoutProcessing,
  ink,
  muted,
}: { payoutProcessing: JobRecord[] } & Tone) {
  return (
    <section aria-label="Payment processing">
      <p
        className={cn(
          "mb-1 text-[11px] font-black uppercase tracking-[0.12em]",
          muted,
        )}
      >
        Payment processing
      </p>
      <ul className="space-y-0">
        {payoutProcessing.map((j) => {
          const addr = meetAddress(j);
          if (!addr) return null;
          const { title, subtitle } = splitPlaceAndArea(addr);
          if (!title) return null;
          return (
            <li key={j.id}>
              <div className="flex cursor-default items-center gap-2 py-[7px]">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-[13px] font-semibold leading-snug",
                      ink,
                    )}
                  >
                    {title}
                  </p>
                  {subtitle ? (
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[11px] font-medium leading-snug",
                        muted,
                      )}
                    >
                      {subtitle}
                    </p>
                  ) : null}
                  <p className={cn("mt-0.5 text-[10px] font-medium", muted)}>
                    Payout pending
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RecentSection({
  recent,
  ink,
  muted,
}:{ recent: JobRecord[] } & Pick<Tone, "ink"> & { muted: string }) {
  return (
    <section aria-label="Recent jobs">
      <ul className="space-y-0">
        {recent.map((j) => {
          const addr = meetAddress(j);
          if (!addr) return null;
          const { title, subtitle } = splitPlaceAndArea(addr);
          if (!title) return null;
          return (
            <li key={j.id}>
              <div className="flex cursor-default items-center gap-2 py-[7px]">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-[13px] font-semibold leading-snug",
                      ink,
                    )}
                  >
                    {title}
                  </p>
                  {subtitle ? (
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[11px] font-medium leading-snug",
                        muted,
                      )}
                    >
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
