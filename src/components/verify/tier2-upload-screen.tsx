"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useVerifyIdentity } from "./use-verify-identity";
import { readFile } from "./verify-helpers";
import {
  Tier2UploadHeader,
  Tier2IdTypeSelect,
  Tier2NinInput,
  Tier2PhotoPicker,
} from "./tier2-upload";

interface Tier2UploadScreenProps {
  isLight?: boolean;
}

export function Tier2UploadScreen({ isLight: propIsLight }: Tier2UploadScreenProps) {
  const router = useRouter();
  const { theme } = useApp();
  const isLight = propIsLight ?? theme === "light";
  const v = useVerifyIdentity();

  // Default ID type to national_id (NIN) if not set yet
  useEffect(() => {
    if (!v.idType && v.idTypes.length > 0) {
      const nin = v.idTypes.find(
        (d) => d.kind === "national_id" || d.api === "nin",
      );
      v.changeIdType(nin?.kind || v.idTypes[0].kind);
    }
  }, [v.idTypes, v.idType, v]);

  // If already submitted or approved, navigate back to /verify
  useEffect(() => {
    if (v.submitted || v.tier2Ok) {
      router.replace("/verify");
    }
  }, [v.submitted, v.tier2Ok, router]);

  // Guard: if user is not past Tier 1, send them back to /verify
  useEffect(() => {
    if (!v.phoneOk && v.userProfile) {
      router.replace("/verify");
    }
  }, [v.phoneOk, v.userProfile, router]);

  const handleFrontFilePicked = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFile(file);
      v.pickIdFront(dataUrl, file.name);
    } catch {
      v.onPhotoReadError();
    }
  };

  const handleFrontFileRemoved = () => {
    v.pickIdFront("", "");
  };

  const handleBackFilePicked = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFile(file);
      v.pickIdBack(dataUrl, file.name);
    } catch {
      v.onPhotoReadError();
    }
  };

  const handleBackFileRemoved = () => {
    v.pickIdBack("", "");
  };

  const needsBack = Boolean(v.selectedDoc?.needsBack);
  const minLen = v.selectedDoc?.minLen ?? 4;
  const isReady = Boolean(
    v.idNumber.trim().length >= minLen &&
      v.idFront &&
      (!needsBack || v.idBack),
  );

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20">
        <Tier2UploadHeader
          onBack={() => navigateBack(router, "/verify", v.accountType)}
        />

        {/* Error Alert */}
        {v.error ? (
          <div className="mb-4 rounded-ona-ctl bg-red-50 dark:bg-red-950/30 border border-ona-danger/30 p-3 text-[13px] text-ona-danger font-medium leading-snug">
            {v.error}
          </div>
        ) : null}

        {/* Form */}
        <div className="space-y-5">
          <Tier2IdTypeSelect
            value={v.idType}
            onChange={v.changeIdType}
            options={v.idTypes}
          />

          <Tier2NinInput
            value={v.idNumber}
            onChange={v.setIdNumber}
            selectedDoc={v.selectedDoc}
          />

          {/* Front Photo Picker */}
          <Tier2PhotoPicker
            id="verify-id-photo-front"
            label={
              needsBack
                ? "Upload ID photo (front)"
                : "Upload ID photo (front only)"
            }
            fileName={v.idFrontName}
            hasFile={Boolean(v.idFront)}
            onFilePicked={handleFrontFilePicked}
            onRemove={handleFrontFileRemoved}
          />

          {/* Back Photo Picker (when document needs both sides) */}
          {needsBack ? (
            <Tier2PhotoPicker
              id="verify-id-photo-back"
              label="Upload ID photo (back)"
              fileName={v.idBackName}
              hasFile={Boolean(v.idBack)}
              onFilePicked={handleBackFilePicked}
              onRemove={handleBackFileRemoved}
            />
          ) : null}

          {/* Submit Button */}
          <button
            type="button"
            disabled={v.busy || !isReady}
            onClick={() => void v.submitId()}
            className={cn(
              "w-full rounded-ona-ctl py-4 text-[14px] font-medium shadow-sm transition-all active:scale-[0.99] cursor-pointer mt-6",
              isReady && !v.busy
                ? "bg-brand text-white hover:opacity-90"
                : "bg-ona-disabled-bg text-ona-disabled-ink cursor-not-allowed",
              v.busy && "opacity-75 cursor-wait",
            )}
          >
            {v.busy ? "Submitting ID…" : "Submit ID for review"}
          </button>
        </div>
      </div>
    </div>
  );
}
