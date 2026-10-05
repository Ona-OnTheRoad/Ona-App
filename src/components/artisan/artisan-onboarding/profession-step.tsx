import { tradeDef } from "@/lib/artisan/catalog";
import {
  OTHER_OPTION,
  otherAnswerKey,
  professionQuestionsFor,
} from "@/lib/artisan/profession-questions";
import { cn } from "@/lib/utils";
import type { StepBaseProps } from "./types";

/** Step 2: category-specific questions only */
export function ProfessionStep({ profile, patch, styles }: StepBaseProps) {
  const { ink, muted, warnBox, panelClass, fieldClass, chipOn, chipOff } =
    styles;
  const trade = tradeDef(profile.trade.service);
  return (
    <section className="space-y-3">
      <h2 className={cn("text-[15px] font-bold", ink)}>
        {trade?.label || "Trade"} questions
      </h2>
      <p className={cn("text-[12px]", muted)}>
        Only for{" "}
        <span className="font-bold">
          {profile.trade.specialty || trade?.label}
        </span>
        . No questions from other professions.
      </p>
      {!profile.trade.specialty ? (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-[12px] font-semibold",
            warnBox,
          )}
        >
          Go back and pick a specialty first.
        </p>
      ) : (
        professionQuestionsFor(profile.trade.service).map((q) => {
          const answers = profile.professionAnswers || {};
          const val = answers[q.id];
          return (
            <div key={q.id} className={panelClass}>
              <p className={cn("text-[12px] font-bold", ink)}>
                {q.label}
                {q.required ? <span className="text-red-600"> *</span> : null}
              </p>
              {q.hint ? (
                <p className={cn("mt-0.5 text-[10px] font-medium", muted)}>
                  {q.hint}
                </p>
              ) : null}
              {q.type === "text" ? (
                <input
                  value={typeof val === "string" ? val : ""}
                  onChange={(e) =>
                    patch({
                      professionAnswers: {
                        ...answers,
                        [q.id]: e.target.value,
                      },
                    })
                  }
                  placeholder={q.placeholder}
                  className={cn("mt-2", fieldClass)}
                />
              ) : null}
              {q.type === "select" && q.options ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {q.options.map((opt) => {
                    const on = val === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          patch({
                            professionAnswers: {
                              ...answers,
                              [q.id]: opt,
                            },
                          })
                        }
                        className={cn(
                          "rounded-md border-0 px-2.5 py-1.5 text-[11px] font-bold",
                          on ? chipOn : chipOff,
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {q.type === "multiselect" && q.options ? (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const arr = Array.isArray(val) ? val : [];
                      const on = arr.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            let next = on
                              ? arr.filter((x) => x !== opt)
                              : [...arr, opt];
                            const max = q.maxSelect ?? 6;
                            // Other doesn't count against max the same way allow +1
                            const maxAllow =
                              opt === OTHER_OPTION ? max + 1 : max;
                            if (next.length > maxAllow)
                              next = next.slice(0, maxAllow);
                            const nextAnswers: Record<
                              string,
                              string | string[]
                            > = {
                              ...answers,
                              [q.id]: next,
                            };
                            if (opt === OTHER_OPTION && on) {
                              // Deselected Other → clear custom text
                              delete nextAnswers[otherAnswerKey(q.id)];
                            }
                            patch({ professionAnswers: nextAnswers });
                          }}
                          className={cn(
                            "rounded-md border-0 px-2.5 py-1.5 text-[11px] font-bold",
                            on ? chipOn : chipOff,
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {Array.isArray(val) && val.includes(OTHER_OPTION) ? (
                    <input
                      className={fieldClass}
                      value={
                        typeof answers[otherAnswerKey(q.id)] === "string"
                          ? (answers[otherAnswerKey(q.id)] as string)
                          : ""
                      }
                      onChange={(e) =>
                        patch({
                          professionAnswers: {
                            ...answers,
                            [otherAnswerKey(q.id)]: e.target.value,
                          },
                        })
                      }
                      placeholder="Type your answer"
                      maxLength={120}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </section>
  );
}
