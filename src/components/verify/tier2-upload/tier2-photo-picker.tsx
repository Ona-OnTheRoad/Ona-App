"use client";

import { useRef } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier2PhotoPickerProps {
  fileName: string;
  hasFile: boolean;
  onFilePicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  isLight?: boolean;
}

export function Tier2PhotoPicker({
  fileName,
  hasFile,
  onFilePicked,
  onRemove,
}: Tier2PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5 text-ona-ink">
        <span>Upload ID photo (front only)</span>{" "}
        <span className="text-ona-danger">*</span>
      </label>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFilePicked}
      />

      {/* Custom file button + text display box matching mockup */}
      <div
        onClick={handleContainerClick}
        className="flex items-stretch rounded-ona-ctl border border-ona-border bg-ona-field overflow-hidden cursor-pointer transition-colors shadow-xs group"
      >
        <div className="px-4 py-3 text-[12px] font-medium shrink-0 transition-colors flex items-center justify-center bg-ona-field-strong text-ona-ink border-r border-ona-border group-hover:opacity-90">
          Choose files
        </div>

        <div
          className={cn(
            "px-4 py-3 text-[12px] truncate flex-1 flex items-center",
            fileName ? "text-ona-ink font-normal" : "text-ona-muted",
          )}
        >
          {fileName ? (
            <span className="flex items-center gap-1.5 truncate">
              <Check className="h-4 w-4 text-ona-success shrink-0" />
              <span className="truncate">{fileName}</span>
            </span>
          ) : (
            "No file chosen"
          )}
        </div>

        {hasFile ? (
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 flex items-center justify-center text-ona-muted hover:text-ona-danger transition-colors"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <p className="text-[12px] mt-2 leading-snug text-ona-muted">
        PNG or JPG (MAX. 800×400px).
      </p>
    </div>
  );
}
