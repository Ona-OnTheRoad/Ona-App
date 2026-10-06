import type { getPhoneCodeOptions } from "@/lib/phone-codes";
import { AboutExperienceSection } from "./about-experience-section";
import { AboutGuarantorSection } from "./about-guarantor-section";
import { AboutIdentitySection } from "./about-identity-section";
import type { ProFieldStyles } from "./field-styles";
import type { ProSignupForm } from "./use-pro-signup-form";

/** Step 4: About you. */
export function StepAbout({
  form,
  styles,
  phoneCodes,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
  phoneCodes: ReturnType<typeof getPhoneCodeOptions>;
}) {
  return (
    <div className="flex flex-col gap-6 pt-1">
      <AboutIdentitySection
        form={form}
        styles={styles}
        phoneCodes={phoneCodes}
      />
      <AboutExperienceSection form={form} styles={styles} />
      <AboutGuarantorSection form={form} styles={styles} />
    </div>
  );
}
