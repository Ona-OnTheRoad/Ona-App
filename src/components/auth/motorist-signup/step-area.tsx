import { authFieldClass as fieldClass } from "@/components/auth/auth-plate";
import { Field } from "./form-parts";

/** Step 2: service area. */
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
    <div className="flex flex-col gap-2.5">
      <Field label="City" required>
        <input
          className={fieldClass}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Lagos"
          autoComplete="address-level2"
        />
      </Field>
      <Field label="Area" required>
        <input
          className={fieldClass}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Yaba, Lekki"
          autoComplete="address-level3"
        />
      </Field>
    </div>
  );
}
