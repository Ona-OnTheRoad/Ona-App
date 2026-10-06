import { Camera, Plus, Trash2 } from "lucide-react";
import { MotoristVehicleWizard } from "@/components/profile/motorist-vehicle-wizard";
import { ProfileSection } from "@/components/profile/profile-shell";
import { profileTheme } from "@/lib/profile-system";
import type { MotoristVehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VehiclesSection({
  isLight,
  vehicles,
  addingVehicle,
  setAddingVehicle,
  setMsg,
  setErr,
  persistVehicles,
}: {
  isLight: boolean;
  vehicles: MotoristVehicle[];
  addingVehicle: boolean;
  setAddingVehicle: (v: boolean) => void;
  setMsg: (v: string | null) => void;
  setErr: (v: string | null) => void;
  persistVehicles: (list: MotoristVehicle[]) => boolean;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection
      title="Vehicles"
      isLight={isLight}
      action={
        !addingVehicle ? (
          <button
            type="button"
            onClick={() => {
              setAddingVehicle(true);
              setMsg(null);
              setErr(null);
            }}
            className={cn(
              "inline-flex items-center gap-1 border-0 bg-transparent text-[12px] font-bold",
              isLight ? "text-slate-900" : "text-white",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Add vehicle
          </button>
        ) : null
      }
    >
      <div className="space-y-3">
        {vehicles.length === 0 && !addingVehicle && (
          <p className={cn("text-[12px]", t.muted)}>
            Add at least one vehicle. You can add as many as you need one step
            at a time.
          </p>
        )}

        {vehicles.map((v) => (
          <div
            key={v.id}
            className={cn(
              "flex gap-3 rounded-xl p-2",
              isLight ? "bg-black/[0.04]" : "bg-white/[0.06]",
            )}
          >
            {v.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                loading="lazy"
                decoding="async"
                src={v.photo}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                  isLight ? "bg-black/8" : "bg-[#2c2c2e]",
                )}
              >
                <Camera className="h-5 w-5 text-brand" />
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-0.5 text-[12px]">
              <p className={cn("font-semibold", t.ink)}>
                {[v.make, v.model, v.year].filter(Boolean).join(" · ")}
              </p>
              {v.plate ? <p className={t.muted}>Plate · {v.plate}</p> : null}
              {(v.commonIssues?.length ?? 0) > 0 && (
                <p className={t.muted}>Issues · {v.commonIssues!.join(", ")}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Remove vehicle"
              onClick={() => {
                if (vehicles.length <= 1) {
                  setErr("Keep at least one vehicle on your account.");
                  return;
                }
                const next = vehicles.filter((x) => x.id !== v.id);
                persistVehicles(next);
              }}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0",
                isLight
                  ? "bg-black/8 text-slate-700"
                  : "bg-[#2c2c2e] text-white/80",
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {addingVehicle && (
          <MotoristVehicleWizard
            isLight={isLight}
            onCancel={() => setAddingVehicle(false)}
            onSave={(v) => {
              const next = [...vehicles, v];
              if (persistVehicles(next)) setAddingVehicle(false);
            }}
          />
        )}
      </div>
    </ProfileSection>
  );
}
