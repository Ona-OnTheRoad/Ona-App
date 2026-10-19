"use client";

import { Button } from "@/components/ui/button";
import { OnaField, OnaSelect } from "@/components/ui/ona-field";

type Option = { value: string; label: string };

function Options({
  options,
  placeholder,
}: {
  options: Option[];
  placeholder?: string;
}) {
  return (
    <>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </>
  );
}

export function VehicleSelectForm({
  isAuthenticated,
  typeSlug,
  makeId,
  modelId,
  year,
  typeOptions,
  makeOptions,
  modelOptions,
  yearOptions,
  setTypeSlug,
  setMakeId,
  setModelId,
  setYear,
  msg,
  busy,
  applyVehicle,
}: {
  isAuthenticated: boolean;
  typeSlug: string;
  makeId: string;
  modelId: string;
  year: number | "";
  typeOptions: Option[];
  makeOptions: Option[];
  modelOptions: Option[];
  yearOptions: Option[];
  setTypeSlug: (v: string) => void;
  setMakeId: (v: string) => void;
  setModelId: (v: string) => void;
  setYear: (v: number | "") => void;
  msg: string | null;
  busy: boolean;
  applyVehicle: (save: boolean) => Promise<void>;
}) {
  const incomplete = !makeId || !modelId;
  return (
    <div data-om-vehicles-form="1" className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3">
        <OnaField label="Select vehicle">
          {({ id, describedBy }) => (
            <OnaSelect
              id={id}
              aria-describedby={describedBy}
              value={typeSlug}
              onChange={(e) => setTypeSlug(e.target.value)}
            >
              <Options options={typeOptions} />
            </OnaSelect>
          )}
        </OnaField>
        <OnaSelect
          aria-label="Make"
          value={makeId}
          onChange={(e) => setMakeId(e.target.value)}
        >
          <Options options={makeOptions} placeholder="Make" />
        </OnaSelect>
        <OnaField label="Model">
          {({ id }) => (
            <OnaSelect
              id={id}
              value={modelId}
              disabled={!makeId}
              onChange={(e) => setModelId(e.target.value)}
            >
              <Options options={modelOptions} placeholder="Select" />
            </OnaSelect>
          )}
        </OnaField>
        <OnaField label="Year (optional)">
          {({ id }) => (
            <OnaSelect
              id={id}
              value={year === "" ? "" : String(year)}
              disabled={!modelId}
              onChange={(e) =>
                setYear(e.target.value ? Number(e.target.value) : "")
              }
            >
              <Options options={yearOptions} placeholder="Select" />
            </OnaSelect>
          )}
        </OnaField>
      </div>
      {msg ? (
        <p
          role="alert"
          className="mt-2 text-[12px] font-semibold text-ona-danger"
        >
          {msg}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2">
        {isAuthenticated ? (
          <Button
            variant="ona"
            size="ona"
            busy={busy}
            disabled={busy || incomplete}
            onClick={() => void applyVehicle(true)}
          >
            Save &amp; browse
          </Button>
        ) : null}
        <Button
          variant={isAuthenticated ? "onaOutline" : "ona"}
          size="ona"
          disabled={busy || incomplete}
          onClick={() => void applyVehicle(false)}
        >
          Browse ALL PARTS
        </Button>
      </div>
    </div>
  );
}
