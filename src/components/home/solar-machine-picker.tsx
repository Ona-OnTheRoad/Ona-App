"use client";

import { useMemo, useState } from "react";
import {
  composeSolarMachineLabel,
  filterSolarOptions,
  SOLAR_CATALOG_TYPES,
  getSolarBrandsForType,
  getSolarModelsForTypeBrand,
} from "@/lib/solar/catalog";
import { MachinePickerView } from "./machine-picker/machine-picker-view";

export type SolarMachineAnswers = {
  machine: string;
  machine_label: string;
  machine_type: string;
  machine_type_label: string;
  machine_brand: string;
  machine_model: string;
  machine_other: string;
};

export function SolarMachinePicker({
  isLight,
  question,
  initial,
  onConfirm,
}: {
  isLight: boolean;
  question: string;
  initial: Record<string, string>;
  onConfirm: (partial: SolarMachineAnswers) => void;
}) {
  const [typeId, setTypeId] = useState(initial.machine_type || "");
  const [brand, setBrand] = useState(initial.machine_brand || "");
  const [model, setModel] = useState(initial.machine_model || "");
  const [otherMode, setOtherMode] = useState(initial.machine === "other");
  const [other, setOther] = useState(initial.machine_other || "");

  const brands = useMemo(() => getSolarBrandsForType(typeId), [typeId]);
  const models = useMemo(
    () => getSolarModelsForTypeBrand(typeId, brand),
    [typeId, brand],
  );

  const catalogReady = Boolean(typeId && brand && model);
  const otherReady = otherMode && other.trim().length > 0;
  const canNext = catalogReady || otherReady;

  const emitCatalog = (
    nextType: string,
    nextBrand: string,
    nextModel: string,
  ) => {
    const typeLabel =
      SOLAR_CATALOG_TYPES.find((t) => t.id === nextType)?.label || nextType;
    onConfirm({
      machine: "catalog",
      machine_label: composeSolarMachineLabel({
        mode: "catalog",
        typeId: nextType,
        brand: nextBrand,
        model: nextModel,
      }),
      machine_type: nextType,
      machine_type_label: typeLabel,
      machine_brand: nextBrand,
      machine_model: nextModel,
      machine_other: "",
    });
  };

  const emitNone = () => {
    onConfirm({
      machine: "none",
      machine_label: composeSolarMachineLabel({ mode: "none" }),
      machine_type: "",
      machine_type_label: "",
      machine_brand: "",
      machine_model: "",
      machine_other: "",
    });
  };

  const emitOther = () => {
    const text = other.trim();
    if (!text) return;
    onConfirm({
      machine: "other",
      machine_label: composeSolarMachineLabel({ mode: "other", other: text }),
      machine_type: "",
      machine_type_label: "",
      machine_brand: "",
      machine_model: "",
      machine_other: text,
    });
  };

  return (
    <MachinePickerView
      isLight={isLight}
      question={question}
      canNext={canNext}
      onNext={() => {
        if (otherReady) emitOther();
        else if (catalogReady) emitCatalog(typeId, brand, model);
      }}
      otherMode={otherMode}
      typeId={typeId}
      typeValue={SOLAR_CATALOG_TYPES.find((t) => t.id === typeId)?.label || ""}
      typeOptions={SOLAR_CATALOG_TYPES.map((t) => t.label)}
      typePlaceholder="Search type (hybrid, off-grid…)"
      onTypeChange={(label) => {
        const hit = SOLAR_CATALOG_TYPES.find((t) => t.label === label);
        setTypeId(hit?.id || "");
        setBrand("");
        setModel("");
      }}
      brand={brand}
      brands={brands}
      onBrandChange={(v) => {
        setBrand(v);
        setModel("");
      }}
      model={model}
      models={models}
      onModelChange={(v) => {
        setModel(v);
        if (typeId && brand && v) emitCatalog(typeId, brand, v);
      }}
      filter={filterSolarOptions}
      other={other}
      onOtherChange={setOther}
      otherPlaceholder="e.g. 5kVA hybrid system, no name on it"
      otherHint="Describe the system, then tap the arrow."
      otherHintClassName="pb-1"
      onNone={emitNone}
      onOtherMode={() => {
        setOtherMode(true);
        setTypeId("");
        setBrand("");
        setModel("");
      }}
    />
  );
}
