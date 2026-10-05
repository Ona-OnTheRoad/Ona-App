import { cn } from "@/lib/utils";
import { BIO_MAX, EXP_YEARS, experienceLabel } from "./constants";
import { RequiredMark } from "./field-parts";
import type { ProFieldStyles } from "./field-styles";
import type { ProSignupForm } from "./use-pro-signup-form";

/** Step 4, part 2: years of service picker and short bio. */
export function AboutExperienceSection({
  form,
  styles,
}: {
  form: ProSignupForm;
  styles: ProFieldStyles;
}) {
  const { yearsExperience, setYearsExperience, bio, setBio } = form;
  return (
    <>
      <section className="flex flex-col gap-2.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
            Years of service
            <RequiredMark />
          </p>
          <p className="mt-0.5 text-[12px] text-[#475569]">
            How many years have you worked? (required)
          </p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {EXP_YEARS.map((year) => {
            const on = yearsExperience === year;
            const isTenPlus = year === "10+";
            return (
              <button
                key={year}
                type="button"
                onClick={() => setYearsExperience(year)}
                aria-pressed={on}
                aria-label={experienceLabel(year)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md px-0.5 text-center font-semibold transition-all",
                  isTenPlus ? "text-[11px] leading-tight" : "text-[14px]",
                  on
                    ? "border-0 bg-[#323231] text-white shadow-[0_2px_8px_rgba(0,0,0,0.16)]"
                    : "border border-[#9A9EA6] bg-[#E2E3E7] text-[#0f172a] shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] active:bg-[#E8E9ED]",
                )}
              >
                {isTenPlus ? (
                  <span className="flex flex-col items-center leading-none">
                    <span>10+</span>
                    <span
                      className={cn(
                        "mt-0.5 text-[9px] font-medium",
                        on ? "text-white/75" : "text-[#475569]",
                      )}
                    >
                      yrs
                    </span>
                  </span>
                ) : (
                  <span className="flex items-baseline gap-0.5">
                    <span>{year}</span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        on ? "text-white/75" : "text-[#475569]",
                      )}
                    >
                      {year === "1" ? "yr" : "yrs"}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
              Short bio
              <RequiredMark />
            </p>
            <p className="mt-0.5 text-[12px] text-[#475569]">
              Write what you do best (max {BIO_MAX} characters)
            </p>
          </div>
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums",
              bio.length > BIO_MAX * 0.9 ? "text-[#FF6B35]" : "text-[#94a3b8]",
            )}
          >
            {bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          className={styles.textareaClass}
          style={styles.fieldStyle}
          value={bio}
          maxLength={BIO_MAX}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          placeholder="e.g. I come on time, fair price, I work nights"
          rows={3}
          required
        />
      </section>
    </>
  );
}
