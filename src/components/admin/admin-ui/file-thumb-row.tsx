"use client";

import { FileThumb } from "./file-thumb";
import type { AdminDocKind } from "./doc-href";

export function FileThumbRow({
  items,
  userId,
}: {
  items: {
    label: string;
    url: string | null | undefined;
    kind?: AdminDocKind;
  }[];
  userId?: string | null;
}) {
  const hasAny = items.some((i) => i.url);
  if (!hasAny) {
    return <span className="om-admin-muted">No files</span>;
  }
  return (
    <div className="om-admin-file-row">
      {items.map((i) =>
        i.url ? (
          <FileThumb
            key={i.label}
            label={i.label}
            url={i.url}
            size="sm"
            userId={userId}
            kind={
              i.kind ||
              (i.label.toLowerCase().includes("back")
                ? "pro_back"
                : i.label.toLowerCase().includes("skill")
                  ? "skill"
                  : i.label.toLowerCase().includes("selfie")
                    ? "selfie"
                    : "pro_front")
            }
          />
        ) : null,
      )}
    </div>
  );
}
