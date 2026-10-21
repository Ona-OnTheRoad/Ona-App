"use client";

import { useId, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { OnaField, OnaSelect } from "@/components/ui/ona-field";
import { VehicleCascadeFields } from "@/components/vehicles/vehicle-cascade-fields";
import type { MotoristVehiclesState } from "./use-motorist-vehicles";

/** "Enter vehicle" sheet (shared BottomSheet, portaled into #ona-phone) on the existing draft state. */
export function VehicleSheet({
  open,
  v: vs,
  onClose,
}: {
  open: boolean;
  v: MotoristVehiclesState;
  onClose: () => void;
}) {
  const titleId = useId();
  const [error, setError] = useState("");
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      titleId={titleId}
      surface="ona"
      className="ona2 text-ona-ink"
      heightPercent={60}
      growToPercent={88}
    >
      <h2 id={titleId} className="text-[16px] font-bold">
        Enter vehicle
      </h2>
      <div className="mt-4 flex flex-col gap-4 pb-6">
        <OnaField label="Vehicle type">
          {({ id }) => (
            <OnaSelect
              id={id}
              value={vs.draftVehicleType}
              onChange={(e) => vs.setDraftVehicleType(e.target.value)}
            >
              <option value="">Select a type</option>
              {vs.vehicleTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </OnaSelect>
          )}
        </OnaField>
        <VehicleCascadeFields
          variant="ona"
          className="grid grid-cols-2 gap-x-3 [&>*:first-child]:col-span-2"
          make={vs.draftMake}
          model={vs.draftModel}
          year={vs.draftYear}
          onMakeChange={vs.setDraftMake}
          onModelChange={vs.setDraftModel}
          onYearChange={vs.setDraftYear}
        />
        {error ? (
          <p role="alert" className="text-[12px] font-medium text-ona-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="ona"
            variant="ona"
            disabled={!vs.draftReady}
            onClick={() => {
              if (!vs.addDraftVehicle()) {
                setError("Pick make and model to add a vehicle.");
                return;
              }
              setError("");
              onClose();
            }}
          >
            Save changes
          </Button>
          {vs.editingId ? (
            <Button
              size="ona"
              variant="onaGhost"
              className="text-ona-danger"
              onClick={() => {
                vs.removeEditing();
                onClose();
              }}
            >
              Remove vehicle
            </Button>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
}
