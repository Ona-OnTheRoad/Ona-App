import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReqStar } from "./req-star";
import type { StepBaseProps } from "./types";

type Props = StepBaseProps & {
  toolDraft: string;
  setToolDraft: (v: string) => void;
};

/** Tools owned: free-text add + removable chips */
export function ToolsField({
  profile,
  patch,
  styles,
  toolDraft,
  setToolDraft,
}: Props) {
  const { soft, fieldClass } = styles;
  const addTool = () => {
    const t = toolDraft.trim();
    if (!t) return;
    if (!profile.toolsOwned.includes(t)) {
      patch({ toolsOwned: [...profile.toolsOwned, t] });
    }
    setToolDraft("");
  };
  return (
    <div>
      <p className={cn("mb-1.5 text-[11px] font-bold", soft)}>
        Tools
        <ReqStar />
      </p>
      <div className="flex gap-2">
        <input
          value={toolDraft}
          onChange={(e) => setToolDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTool();
            }
          }}
          className={cn("min-w-0 flex-1", fieldClass)}
          placeholder="Add custom tool"
        />
        <button
          type="button"
          onClick={addTool}
          className="h-10 rounded-md border-0 bg-[#FF6B35] px-3 text-[12px] font-bold text-white"
        >
          Add
        </button>
      </div>
      {profile.toolsOwned.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.toolsOwned.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-md bg-[#FF6B35] px-2 py-1 text-[11px] font-bold text-white"
            >
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() =>
                  patch({
                    toolsOwned: profile.toolsOwned.filter((x) => x !== t),
                  })
                }
                className="border-0 bg-transparent p-0 text-white"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
