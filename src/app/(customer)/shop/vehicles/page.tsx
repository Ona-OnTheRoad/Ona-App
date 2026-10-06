"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SavedGarage } from "@/components/shop/vehicles/saved-garage";
import { useVehiclesPage } from "@/components/shop/vehicles/use-vehicles-page";
import { VehicleSelectForm } from "@/components/shop/vehicles/vehicle-select-form";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ShopVehiclesPage() {
  const { theme, isAuthenticated } = useApp();
  const isLight = theme === "light";
  const v = useVehiclesPage();

  const bg = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const muted = isLight ? "text-slate-600" : "text-white/55";

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col overflow-hidden", bg)}
      data-om-vehicles-page="flat-2d-v2"
    >
      <PageHeader title="My vehicles" backHref="/shop" />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-2">
        {/* Intro short only; no catalog/fitment blurb */}
        <p className={cn("mb-3 text-[12px] leading-relaxed", muted)}>
          Pick your vehicle to browse ALL PARTS.
        </p>

        {!isAuthenticated ? (
          <p
            className={cn(
              "mb-3 rounded-md border-0 px-3 py-2 text-[12px]",
              isLight ? "text-slate-700" : "text-white/70",
            )}
          >
            Sign in to save vehicles to your garage. You can still browse with a
            temporary selection.
          </p>
        ) : null}

        {/* No card border / panel edge flush with page */}
        <VehicleSelectForm
          isLight={isLight}
          isAuthenticated={isAuthenticated}
          typeSlug={v.typeSlug}
          makeId={v.makeId}
          modelId={v.modelId}
          year={v.year}
          typeOptions={v.typeOptions}
          makeOptions={v.makeOptions}
          modelOptions={v.modelOptions}
          yearOptions={v.yearOptions}
          setTypeSlug={v.setTypeSlug}
          setMakeId={v.setMakeId}
          setModelId={v.setModelId}
          setYear={v.setYear}
          msg={v.msg}
          busy={v.busy}
          applyVehicle={v.applyVehicle}
        />

        {isAuthenticated && v.garage.length > 0 ? (
          <SavedGarage
            garage={v.garage}
            isLight={isLight}
            muted={muted}
            onSetDefault={v.setDefault}
            onRemove={v.remove}
          />
        ) : null}
      </div>
    </div>
  );
}
