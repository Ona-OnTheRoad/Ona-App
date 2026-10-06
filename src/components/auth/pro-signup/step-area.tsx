import { Field } from "./field-parts";
import type { ProFieldStyles } from "./field-styles";
import type { ProSignupForm } from "./use-pro-signup-form";

/** Step 6: Service area. */
export function StepArea({
  form,
  styles,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
}) {
  const { city, setCity, area, setArea, serviceRadiusKm, setServiceRadiusKm } =
    form;
  return (
    <>
      <Field label="City">
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Lagos"
        />
      </Field>
      <Field label="Area">
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Yaba"
        />
      </Field>
      <Field label={`Service radius: ${serviceRadiusKm} km`}>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={serviceRadiusKm}
          onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
          className="mt-2 w-full accent-[#FF6B35]"
        />
      </Field>
    </>
  );
}
