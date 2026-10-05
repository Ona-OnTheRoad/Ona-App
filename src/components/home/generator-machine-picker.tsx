"use client";

import { useMemo, useState } from "react";
import {
  composeGeneratorMachineLabel,
  filterGeneratorOptions,
  GEN_CATALOG_TYPES,
  getBrandsForType,
  getModelsForTypeBrand,
  inferGeneratorFuel,
} from "@/lib/generator/catalog";
import {
  GEN_MACHINE_NONE_ID,
  GEN_MACHINE_OTHER_ID,
} from "@/lib/generator/question-tree";
import { MachinePickerView } from "./machine-picker/machine-picker-view";

export type GeneratorMachineAnswers = {
  machine: string;
  machine_label: string;
  machine_type: string;
  machine_type_label: string;
  machine_brand: string;
  machine_model: string;
  machine_fuel: string;
  machine_other: string;
};

export function GeneratorMachinePicker({
  isLight,
  question,
  initial,
  onConfirm,
}: {
  isLight: boolean;
  question: string;
  initial: Record<string, string>;
  onConfirm: (partial: GeneratorMachineAnswers) => void;
}) {
  const [typeId, setTypeId] = useState(initial.machine_type || "");
  const [brand, setBrand] = useState(initial.machine_brand || "");
  const [model, setModel] = useState(initial.machine_model || "");
  const [otherMode, setOtherMode] = useState(
    initial.machine === GEN_MACHINE_OTHER_ID,
  );
  const [other, setOther] = useState(initial.machine_other || "");

  const brands = useMemo(() => getBrandsForType(typeId), [typeId]);
  const models = useMemo(
    () => getModelsForTypeBrand(typeId, brand),
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
      GEN_CATALOG_TYPES.find((t) => t.id === nextType)?.label || nextType;
    const fuel = inferGeneratorFuel(nextType);
    onConfirm({
      machine: "catalog",
      machine_label: composeGeneratorMachineLabel({
        mode: "catalog",
        typeId: nextType,
        brand: nextBrand,
        model: nextModel,
      }),
      machine_type: nextType,
      machine_type_label: typeLabel,
      machine_brand: nextBrand,
      machine_model: nextModel,
      machine_fuel: fuel || "",
      machine_other: "",
    });
  };

  const emitNone = () => {
    onConfirm({
      machine: GEN_MACHINE_NONE_ID,
      machine_label: composeGeneratorMachineLabel({ mode: "none" }),
      machine_type: "",
      machine_type_label: "",
      machine_brand: "",
      machine_model: "",
      machine_fuel: "",
      machine_other: "",
    });
  };

  const emitOther = () => {
    const text = other.trim();
    if (!text) return;
    onConfirm({
      machine: GEN_MACHINE_OTHER_ID,
      machine_label: composeGeneratorMachineLabel({
        mode: "other",
        other: text,
      }),
      machine_type: "",
      machine_type_label: "",
      machine_brand: "",
      machine_model: "",
      machine_fuel: "",
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
      typeValue={GEN_CATALOG_TYPES.find((t) => t.id === typeId)?.label || ""}
      typeOptions={GEN_CATALOG_TYPES.map((t) => t.label)}
      typePlaceholder="Search type (petrol, diesel…)"
      onTypeChange={(label) => {
        const hit = GEN_CATALOG_TYPES.find((t) => t.label === label);
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
      filter={filterGeneratorOptions}
      other={other}
      onOtherChange={setOther}
      otherPlaceholder="e.g. Red petrol gen, 2.5kVA, no name on it"
      otherHint="Describe the generator, then tap the arrow."
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
