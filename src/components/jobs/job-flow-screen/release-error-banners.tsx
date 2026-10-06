import type { ReactElement } from "react";

interface BannerProps {
  message: string;
  onCopy: () => void;
  onDismiss: () => void;
}

/** Only shown when the FLW message is clearly IP-whitelist related. */
export function isEgressIpError(message: string | null): boolean {
  return (
    Boolean(message) &&
    /ip whitelist|ip whitelisting|whitelist.*ip|ip policy/i.test(message || "")
  );
}

/** Release error banner in the footer (with optional egress-IP help). */
export function ReleaseErrorFooterBanner({
  message,
  showEgressHint,
  onCopy,
  onDismiss,
}: BannerProps & { showEgressHint: boolean }): ReactElement {
  return (
    <div
      className="z-20 max-h-48 overflow-y-auto rounded-lg border border-red-500/40 bg-red-50 px-3 py-2.5 text-left dark:bg-red-950/40"
      role="alert"
    >
      <p className="text-[12px] font-semibold leading-snug text-red-700 dark:text-red-300">
        {message}
      </p>
      {showEgressHint ? (
        <p className="mt-2 text-[11px] font-medium leading-snug text-red-800/90 dark:text-red-200/90">
          Optional: if Flutterwave IP Whitelisting is ON, check{" "}
          <a
            href="/api/payments/egress-ip"
            target="_blank"
            rel="noreferrer"
            className="font-bold underline"
          >
            /api/payments/egress-ip
          </a>{" "}
          or turn IP Whitelisting OFF. Prefer{" "}
          <code className="text-[10px]">FLUTTERWAVE_TRANSFER_PROXY_URL</code>{" "}
          for a fixed payout IP.
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border-0 bg-red-600/15 px-2.5 py-1 text-[11px] font-bold text-red-700"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border-0 bg-black/5 px-2.5 py-1 text-[11px] font-bold text-red-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/** Compact release error banner inside the release card. */
export function ReleaseErrorCardBanner({
  message,
  onCopy,
  onDismiss,
}: BannerProps): ReactElement {
  return (
    <div
      className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-left dark:bg-red-950/30"
      role="alert"
    >
      <p className="text-[12px] font-semibold leading-snug text-red-600 dark:text-red-300">
        {message}
      </p>
      <div className="mt-1.5 flex gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="text-[11px] font-bold text-red-700 underline"
        >
          Copy error
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] font-bold text-red-700 underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
