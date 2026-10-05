import type { getExpressScreen } from "@/lib/express/question-engine";
import { cn } from "@/lib/utils";
import type { ExpressTheme } from "./types";

type Screen = NonNullable<ReturnType<typeof getExpressScreen>>;

type Props = {
  theme: ExpressTheme;
  screen: Screen;
  draft: string;
  onDraftChange: (v: string) => void;
  onPickOption: (id: string, label: string) => void;
};

/** Same Q&A pattern as the homepage mechanic flow. */
export function QuestionsView({
  theme,
  screen,
  draft,
  onDraftChange,
  onPickOption,
}: Props) {
  const { ink, muted, rowCard, field } = theme;
  return (
    <>
      <p
        className={cn(
          "mt-2 px-0.5 pb-2 text-[14px] font-bold capitalize leading-snug",
          ink,
        )}
      >
        {screen.question}
      </p>
      {screen.kind === "choice" ? (
        <div className="flex flex-col gap-1">
          {(screen.options || []).map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPickOption(opt.id, opt.label)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[4px] border-0 px-1 py-3 text-left transition-transform duration-150 active:scale-[0.985]",
                rowCard,
              )}
            >
              <span
                className={cn("w-5 shrink-0 text-[12px] font-bold", muted)}
              >
                {i + 1}.
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 text-[13px] font-semibold capitalize leading-snug",
                  ink,
                )}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={3}
            placeholder={screen.placeholder}
            className={cn(
              "w-full resize-none rounded-xl border-0 px-3 py-2 text-[13px] font-medium leading-snug outline-none",
              field,
            )}
          />
        </div>
      )}
    </>
  );
}
