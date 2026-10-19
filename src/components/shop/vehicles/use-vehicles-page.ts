"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  writeSessionVehicle,
  type ActiveVehicle,
} from "@/components/shop/shop-vehicle-bar";
import { authFetch } from "@/lib/api-auth-headers";
import { useApp } from "@/lib/store";
import { toastError } from "@/lib/toast";
import { FALLBACK_TYPES } from "./constants";
import type { GarageV, Make, Model, VehicleType } from "./types";

export function useVehiclesPage() {
  const { isAuthenticated } = useApp();
  const router = useRouter();
  const [garage, setGarage] = useState<GarageV[]>([]);
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [typeSlug, setTypeSlug] = useState("automobile");
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  const loadGarage = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await authFetch("/api/shop/vehicles");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { vehicles?: GarageV[] };
    };
    if (json.ok) setGarage(json.data?.vehicles ?? []);
  }, [isAuthenticated]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/shop/vehicles/catalog?level=types");
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { types?: VehicleType[] };
      };
      if (json.ok && json.data?.types?.length) setTypes(json.data.types);
    })();
    void loadGarage();
  }, [loadGarage]);

  useEffect(() => {
    setMakes([]);
    setModels([]);
    setModelId("");
    setYears([]);
    setYear("");
    setMakeId("");
    void (async () => {
      const res = await fetch(
        `/api/shop/vehicles/catalog?level=makes&type=${encodeURIComponent(typeSlug)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { makes?: Make[] };
      };
      if (json.ok) setMakes(json.data?.makes ?? []);
    })();
  }, [typeSlug]);

  useEffect(() => {
    if (!makeId) {
      setModels([]);
      setModelId("");
      return;
    }
    void (async () => {
      const res = await fetch(
        `/api/shop/vehicles/catalog?level=models&makeId=${encodeURIComponent(makeId)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { models?: Model[] };
      };
      if (json.ok) setModels(json.data?.models ?? []);
    })();
  }, [makeId]);

  useEffect(() => {
    if (!modelId) {
      setYears([]);
      setYear("");
      return;
    }
    void (async () => {
      const res = await fetch(
        `/api/shop/vehicles/catalog?level=years&modelId=${encodeURIComponent(modelId)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { years?: number[] };
      };
      if (json.ok) setYears(json.data?.years ?? []);
    })();
  }, [modelId]);

  const makeName = makes.find((m) => m.id === makeId)?.name || "";
  const modelName = models.find((m) => m.id === modelId)?.name || "";

  const typeOptions = useMemo(
    () =>
      (types.length ? types : FALLBACK_TYPES).map((t) => ({
        value: t.slug,
        label: t.name,
      })),
    [types],
  );
  const makeOptions = useMemo(
    () => [
      { value: "", label: "Make" },
      ...makes.map((m) => ({ value: m.id, label: m.name })),
    ],
    [makes],
  );
  const modelOptions = useMemo(
    () => [
      { value: "", label: "Model" },
      ...models.map((m) => ({ value: m.id, label: m.name })),
    ],
    [models],
  );
  const yearOptions = useMemo(
    () => [
      { value: "", label: "Year (optional)" },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ],
    [years],
  );

  const applyVehicle = async (save: boolean) => {
    if (!makeName || !modelName) {
      toastError("Pick make and model");
      return;
    }
    const v: ActiveVehicle = {
      vehicleTypeSlug: typeSlug,
      makeId: makeId || null,
      modelId: modelId || null,
      makeName,
      modelName,
      year: year === "" ? null : Number(year),
    };
    writeSessionVehicle(v);
    if (save && isAuthenticated) {
      setBusy(true);
      const res = await authFetch("/api/shop/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleTypeSlug: typeSlug,
          makeId,
          modelId,
          makeName,
          modelName,
          year: v.year,
          setDefault: true,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: { message?: string };
      };
      setBusy(false);
      if (!json.ok) {
        toastError(json.error?.message || "Could not save");
        return;
      }
      await loadGarage();
    }
    router.push(
      `/shop/c/mechanic?allParts=1&makeName=${encodeURIComponent(makeName)}&modelName=${encodeURIComponent(modelName)}${v.year ? `&year=${v.year}` : ""}&makeId=${makeId}&modelId=${modelId}&vehicleType=${encodeURIComponent(typeSlug)}`,
    );
  };

  const setDefault = async (id: string) => {
    await authFetch("/api/shop/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default", vehicleId: id }),
    });
    const g = garage.find((x) => x.id === id);
    if (g) writeSessionVehicle(g);
    await loadGarage();
  };

  const remove = async (id: string) => {
    await authFetch("/api/shop/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", vehicleId: id }),
    });
    await loadGarage();
  };

  return {
    garage,
    typeSlug,
    setTypeSlug,
    makeId,
    setMakeId,
    modelId,
    setModelId,
    year,
    setYear,
    busy,
    typeOptions,
    makeOptions,
    modelOptions,
    yearOptions,
    applyVehicle,
    setDefault,
    remove,
  };
}
