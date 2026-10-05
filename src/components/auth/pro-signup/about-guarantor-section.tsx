import { Field, RequiredMark } from "./field-parts";
import type { ProFieldStyles } from "./field-styles";
import type { ProSignupForm } from "./use-pro-signup-form";

/** Step 4, part 3: Guarantor compulsory for Repair Pro. */
export function AboutGuarantorSection({
  form,
  styles,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
}) {
  const {
    guarantorName,
    setGuarantorName,
    guarantorPhone,
    setGuarantorPhone,
    guarantorOccupation,
    setGuarantorOccupation,
    guarantorAddress,
    setGuarantorAddress,
    guarantorRelationship,
    setGuarantorRelationship,
  } = form;
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
          Guarantor
          <RequiredMark />
        </p>
        <p className="mt-0.5 text-[12px] text-[#475569]">
          Provide a guarantor reference (required). Must be at least name,
          phone, and your relationship.
        </p>
      </div>
      <Field label="Full name" required>
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={guarantorName}
          onChange={(e) => setGuarantorName(e.target.value)}
          placeholder="e.g. Chidi Okafor"
        />
      </Field>
      <Field label="Phone" required>
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={guarantorPhone}
          onChange={(e) =>
            setGuarantorPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
          }
          placeholder="e.g. 8012345678"
          type="tel"
          inputMode="numeric"
        />
      </Field>
      <Field label="Occupation">
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={guarantorOccupation}
          onChange={(e) => setGuarantorOccupation(e.target.value)}
          placeholder="e.g. Business owner"
        />
      </Field>
      <Field label="Residential address">
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={guarantorAddress}
          onChange={(e) => setGuarantorAddress(e.target.value)}
          placeholder="e.g. 25 Awolowo Road, Ikeja"
        />
      </Field>
      <Field label="Relationship to you" required>
        <input
          className={styles.fieldClass}
          style={styles.fieldStyle}
          value={guarantorRelationship}
          onChange={(e) => setGuarantorRelationship(e.target.value)}
          placeholder="e.g. Uncle, Former employer, Pastor"
        />
      </Field>
    </section>
  );
}
