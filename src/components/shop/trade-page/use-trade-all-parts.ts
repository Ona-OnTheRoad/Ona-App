import { useCallback, useEffect, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { AllPartsCat, TradeProductCard } from "./trade-page-types";

type Args = {
  allParts: boolean;
  trade: string;
  ctx: string;
  searchParams: ReadonlyURLSearchParams;
};

/** ALL PARTS mode (C3: tree then list) */
export function useTradeAllParts({ allParts, trade, ctx, searchParams }: Args) {
  const [cats, setCats] = useState<AllPartsCat[]>([]);
  const [partsProducts, setPartsProducts] = useState<TradeProductCard[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(
    searchParams.get("categoryId"),
  );
  const [vehicleLabel, setVehicleLabel] = useState<string | null>(null);

  const loadAllParts = useCallback(async () => {
    if (!allParts) return;
    const makeName = searchParams.get("makeName") || "";
    const modelName = searchParams.get("modelName") || "";
    if (!makeName || !modelName) return;
    setPartsLoading(true);
    try {
      const qs = new URLSearchParams({
        trade,
        makeName,
        modelName,
        ctx,
      });
      if (searchParams.get("year")) qs.set("year", searchParams.get("year")!);
      if (searchParams.get("makeId"))
        qs.set("makeId", searchParams.get("makeId")!);
      if (searchParams.get("modelId"))
        qs.set("modelId", searchParams.get("modelId")!);
      if (categoryId) qs.set("categoryId", categoryId);
      const res = await fetch(`/api/shop/all-parts?${qs.toString()}`);
      const json = (await res.json()) as {
        ok?: boolean;
        data?: {
          vehicle?: {
            makeName: string;
            modelName: string;
            year: number | null;
          };
          categories?: AllPartsCat[];
          products?: TradeProductCard[];
        };
      };
      if (json.ok && json.data) {
        const v = json.data.vehicle;
        setVehicleLabel(
          v
            ? [v.year, v.makeName, v.modelName].filter(Boolean).join(" ")
            : null,
        );
        setCats(json.data.categories ?? []);
        setPartsProducts(json.data.products ?? []);
      }
    } finally {
      setPartsLoading(false);
    }
  }, [allParts, trade, searchParams, categoryId, ctx]);

  useEffect(() => {
    void loadAllParts();
  }, [loadAllParts]);

  return {
    cats,
    partsProducts,
    partsLoading,
    categoryId,
    setCategoryId,
    vehicleLabel,
  };
}
