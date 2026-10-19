import { ArrowLeft } from "lucide-react";

/**
 * Header for the in-sheet request flows: back arrow, coral tag pill, title and
 * optional subtitle. `onBack` omitted hides the arrow.
 */
export function OnaFlowHeader({
  onBack,
  tag,
  title,
  subtitle,
  titleId,
}: {
  onBack?: () => void;
  tag?: string;
  title: string;
  subtitle?: string;
  titleId?: string;
}) {
  return (
    <header className="shrink-0 pb-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-ona-ink"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      {tag ? (
        <span className="mt-0.5 inline-block rounded-full bg-ona-brand-soft px-2.5 py-1 text-[11px] font-semibold leading-none text-ona-brand-ink">
          {tag}
        </span>
      ) : null}
      <h2
        id={titleId}
        className="mt-2 text-[20px] font-bold leading-tight text-ona-ink"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1.5 text-[13px] font-medium leading-snug text-ona-muted">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
