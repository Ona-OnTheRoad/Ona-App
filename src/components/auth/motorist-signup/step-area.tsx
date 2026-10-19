import { OnaField, OnaInput } from "@/components/ui/ona-field";

/** Step 3: service area (City / Area inputs). */
export function StepArea({
  city,
  setCity,
  area,
  setArea,
}: {
  city: string;
  setCity: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <OnaField label="City" required>
        {({ id }) => (
          <OnaInput
            id={id}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Lagos"
            autoComplete="address-level2"
          />
        )}
      </OnaField>
      <OnaField label="Area" required>
        {({ id }) => (
          <OnaInput
            id={id}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Yaba, Lekki"
            autoComplete="address-level3"
          />
        )}
      </OnaField>
    </div>
  );
}
