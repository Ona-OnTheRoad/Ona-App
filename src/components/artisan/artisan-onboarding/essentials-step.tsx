import { countryName } from "@/lib/geo/service-area";
import { cn } from "@/lib/utils";
import { ReqStar } from "./req-star";
import { ServiceAreaLinks } from "./service-area-links";
import { ToolsField } from "./tools-field";
import type { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  toolDraft: string;
  setToolDraft: (v: string) => void;
};

/** Step 4: experience, service area, tools, guarantor */
export function EssentialsStep({
  profile,
  patch,
  styles,
  toolDraft,
  setToolDraft,
}: Props) {
  const { ink, muted, soft, panelClass, fieldClass } = styles;
  return (
    <section className="space-y-3">
      <h2 className={cn("text-[15px] font-bold", ink)}>Profile details</h2>
      <label className={cn("block text-[11px] font-bold", soft)}>
        Years of experience
        <ReqStar />
        <input
          type="number"
          min={1}
          max={60}
          value={profile.yearsExperience}
          onChange={(e) =>
            patch({
              yearsExperience: Math.max(1, Number(e.target.value) || 1),
            })
          }
          className={cn("mt-1", fieldClass)}
        />
      </label>

      {/* Country locked from signup */}
      <div className={panelClass}>
        <p className={cn("text-[11px] font-bold", soft)}>
          Service area country
        </p>
        <p className={cn("mt-1 text-[14px] font-semibold", ink)}>
          {profile.serviceArea.countryName ||
            countryName(profile.serviceArea.countryCode || "NG")}
        </p>
        <p className={cn("mt-0.5 text-[10px] font-medium", muted)}>
          From your signup and cannot be changed
        </p>
      </div>

      <ServiceAreaLinks profile={profile} styles={styles} />

      <ToolsField
        profile={profile}
        patch={patch}
        styles={styles}
        toolDraft={toolDraft}
        setToolDraft={setToolDraft}
      />

      <div className={panelClass}>
        <p className={cn("mb-2 text-[12px] font-bold", ink)}>
          Guarantor
          <ReqStar />
        </p>
        <label className={cn("mb-2 block text-[11px] font-bold", soft)}>
          Full name
          <ReqStar />
          <input
            value={profile.guarantor.fullName}
            onChange={(e) =>
              patch({
                guarantor: {
                  ...profile.guarantor,
                  fullName: e.target.value,
                },
              })
            }
            className={cn("mt-1", fieldClass)}
          />
        </label>
        <label className={cn("block text-[11px] font-bold", soft)}>
          Phone
          <ReqStar />
          <input
            value={profile.guarantor.phone}
            onChange={(e) =>
              patch({
                guarantor: {
                  ...profile.guarantor,
                  phone: e.target.value,
                },
              })
            }
            className={cn("mt-1", fieldClass)}
            inputMode="tel"
          />
        </label>
      </div>
    </section>
  );
}
