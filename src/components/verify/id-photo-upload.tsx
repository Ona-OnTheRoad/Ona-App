"use client";

import { Upload } from "lucide-react";
import { UploadInlinePreview } from "@/components/media/upload-inline-preview";
import { cn } from "@/lib/utils";
import { readFile } from "./verify-helpers";

/** One ID photo picker (front or back) with inline preview. */
export function IdPhotoUpload({
  isLight,
  phoneOk,
  dataUrl,
  fileName,
  buttonLabel,
  previewLabel,
  onPick,
  onReadError,
}: {
  isLight: boolean;
  phoneOk: boolean;
  dataUrl: string;
  fileName: string;
  buttonLabel: string;
  previewLabel: string;
  onPick: (dataUrl: string, name: string) => void;
  onReadError: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={cn(
          "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 text-[12px] font-bold",
          isLight ? "bg-black/10 text-slate-800" : "bg-[#2c2c2e] text-white",
          !phoneOk && "pointer-events-none opacity-50",
        )}
      >
        <Upload className="h-3.5 w-3.5" />
        {buttonLabel}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={!phoneOk}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              onPick(await readFile(f), f.name);
            } catch {
              onReadError();
            }
          }}
        />
      </label>
      {dataUrl ? (
        <UploadInlinePreview
          url={dataUrl}
          label={previewLabel}
          fileName={fileName}
          isLight={isLight}
          defaultOpen
        />
      ) : null}
    </div>
  );
}
