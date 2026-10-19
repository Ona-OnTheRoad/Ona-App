"use client";

import { useRouter } from "next/navigation";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { SavedGarage } from "@/components/shop/vehicles/saved-garage";
import { useVehiclesPage } from "@/components/shop/vehicles/use-vehicles-page";
import { VehicleSelectForm } from "@/components/shop/vehicles/vehicle-select-form";
import { useApp } from "@/lib/store";

export default function ShopVehiclesPage() {
  const { isAuthenticated } = useApp();
  const router = useRouter();
  const v = useVehiclesPage();

  return (
    <OnaScreen
      onBack={() => router.push("/shop")}
      className="min-h-0"
      bodyClassName="flex flex-col"
    >
      <div
        className="flex min-h-0 flex-1 flex-col pt-3"
        data-om-vehicles-page="flat-2d-v2"
      >
        <OnaTitle
          title="My vehicles"
          subtitle="Pick your vehicle to browse ALL PARTS."
          className="mb-5"
        />

        {!isAuthenticated ? (
          <p className="mb-3 text-[12px] text-ona-muted">
            Sign in to save vehicles to your garage. You can still browse with a
            temporary selection.
          </p>
        ) : null}

        <VehicleSelectForm
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
            onSetDefault={v.setDefault}
            onRemove={v.remove}
          />
        ) : null}
      </div>
    </OnaScreen>
  );
}
