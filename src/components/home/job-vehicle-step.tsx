"use client";

import { useId, useMemo, useState } from "react";
import { Car, ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { OnaFlowHeader } from "@/components/ui/ona-flow-header";
import { VehicleCascadeFields } from "@/components/vehicles/vehicle-cascade-fields";
import {
  canUseVehicleLabel,
  formatVehicleLabel,
  profileVehiclesOf,
} from "@/components/home/job-vehicle-helpers";
import type { MotoristVehicle } from "@/lib/types";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { OnaAddPill } from "@/components/ui/ona-add-pill";
import { cn } from "@/lib/utils";

export { canUseVehicleLabel, formatVehicleLabel, profileVehiclesOf };

export function JobVehicleStep({
  isLight,
  vehicles,
  label,
  onChange,
  onPick,
  onSaveVehicle,
  onBack,
  tag,
}: {
  isLight: boolean;
  /** Coral request tag shown above the title (e.g. "Mechanic request"). */
  tag?: string;
  vehicles: MotoristVehicle[];
  label: string;
  onChange: (label: string) => void;
  /** Tapping a saved vehicle advances to the next question. */
  onPick?: (label: string, vehicle?: MotoristVehicle) => void;
  /** Persist a manually entered vehicle. Returns an error string or null. */
  onSaveVehicle?: (vehicle: MotoristVehicle) => string | null;
  /** When set, renders a pinned Back bar (with Save vehicle in manual mode). */
  onBack?: () => void;
}) {
  const [manual, setManual] = useState(vehicles.length === 0);
  const [vehicleType, setVehicleType] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [powertrain, setPowertrain] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  useFeedbackToast("", saveError ?? "");

  const savedMatch = useMemo(
    () => vehicles.find((v) => formatVehicleLabel(v) === label),
    [vehicles, label],
  );

  const pushManual = (
    nextType: string,
    nextMake: string,
    nextModel: string,
    nextYear: string,
  ) => {
    onChange(
      formatVehicleLabel({
        vehicleType: nextType,
        make: nextMake,
        model: nextModel,
        year: nextYear,
      }),
    );
  };

  const handleSave = () => {
    setSaveError(null);
    if (!make.trim() || !model.trim()) {
      setSaveError("Enter brand and model first.");
      return;
    }
    const saved: MotoristVehicle = {
      id: `veh_${Date.now()}`,
      make: make.trim(),
      model: model.trim(),
      year: year.trim() || undefined,
      vehicleType: vehicleType.trim() || undefined,
      powertrain: powertrain.trim() || undefined,
    };
    if (onSaveVehicle) {
      const err = onSaveVehicle(saved);
      if (err) {
        setSaveError(err);
        return;
      }
    }
    setManual(false);
    onChange(formatVehicleLabel(saved));
  };

  const pickVehicle = (text: string) => {
    onChange(text);
    const picked = vehicles.find((v) => formatVehicleLabel(v) === text);
    onPick?.(text, picked);
  };

  const titleId = useId();
  const hasSaved = vehicles.length > 0;
  /** Saved vehicles: "Enter another" opens a sheet. None saved: inline form. */
  const sheetOpen = manual && hasSaved;
  const inlineForm = manual && !hasSaved;
  const ctaVehicle = savedMatch ?? vehicles[0];

  const saveButton = (
    <Button
      size="ona"
      variant="ona"
      disabled={!make.trim() || !model.trim()}
      onClick={handleSave}
    >
      Save vehicle
    </Button>
  );

  const form = (
    <VehicleCascadeFields
      variant="ona"
      isLight={isLight}
      makeLabel="Brand"
      vehicleType={vehicleType}
      onVehicleTypeChange={(v) => {
        setVehicleType(v);
        pushManual(v, make, model, year);
      }}
      powertrain={powertrain}
      onPowertrainChange={(v) => {
        setPowertrain(v);
        pushManual(vehicleType, make, model, year);
      }}
      make={make}
      model={model}
      year={year}
      onMakeChange={(v) => {
        setMake(v);
        pushManual(vehicleType, v, "", "");
      }}
      onModelChange={(v) => {
        setModel(v);
        pushManual(vehicleType, make, v, "");
      }}
      onYearChange={(v) => {
        setYear(v);
        pushManual(vehicleType, make, model, v);
      }}
    />
  );

  const list = (
    <div className="flex flex-col gap-2.5 pb-2">
      {vehicles.map((v) => {
        const on = savedMatch?.id === v.id;
        const meta = [v.year, v.powertrain, v.plate]
          .filter(Boolean)
          .join(" · ");
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => pickVehicle(formatVehicleLabel(v))}
            className={cn(
              "flex min-h-16 w-full items-center gap-3 rounded-ona-card border bg-ona-surface px-3 py-2.5 text-left",
              on ? "border-ona-brand" : "border-ona-border",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ona-ctl bg-ona-brand-soft text-ona-brand-ink">
              <Car className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-ona-ink">
                {[v.make, v.model].filter(Boolean).join(" ") ||
                  formatVehicleLabel(v)}
              </span>
              {meta ? (
                <span className="block truncate text-[12px] font-medium text-ona-muted">
                  {meta}
                </span>
              ) : null}
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-ona-muted"
              aria-hidden
            />
          </button>
        );
      })}
      <OnaAddPill
        onClick={() => {
          setManual(true);
          setSaveError(null);
          onChange("");
        }}
      >
        Enter another vehicle
      </OnaAddPill>
    </div>
  );

  const header = (
    <OnaFlowHeader
      tag={tag}
      onBack={onBack}
      title={inlineForm ? "Enter your vehicle" : "Which vehicle needs help?"}
      subtitle={
        inlineForm ? undefined : "This helps your professional arrive prepared."
      }
    />
  );

  const sheet = (
    <BottomSheet
      open={sheetOpen}
      onClose={() => {
        setManual(false);
        setSaveError(null);
      }}
      titleId={titleId}
      className="ona2"
      surface="ona"
      heightPercent={55}
      growToPercent={90}
    >
      <h2 id={titleId} className="text-[16px] font-bold text-ona-ink">
        Enter vehicle
      </h2>
      <div className="mt-4">{form}</div>
      <div className="mt-4">{saveButton}</div>
    </BottomSheet>
  );

  if (onBack) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
          {inlineForm ? form : list}
        </div>
        {inlineForm || (hasSaved && ctaVehicle) ? (
          <div className="shrink-0 pt-3">
            {inlineForm ? (
              saveButton
            ) : (
              <Button
                size="ona"
                variant="ona"
                onClick={() => pickVehicle(formatVehicleLabel(ctaVehicle))}
              >
                {`Continue with ${[ctaVehicle.make, ctaVehicle.model].filter(Boolean).join(" ")}`}
              </Button>
            )}
          </div>
        ) : null}
        {sheet}
      </div>
    );
  }

  return (
    <div>
      {header}
      {inlineForm ? (
        <div>
          {form}
          <div className="mt-3">{saveButton}</div>
        </div>
      ) : (
        list
      )}
      {sheet}
    </div>
  );
}
