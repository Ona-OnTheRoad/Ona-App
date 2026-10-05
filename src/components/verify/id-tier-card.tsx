"use client";

import { Upload } from "lucide-react";
import {
  authFieldClass,
  authLabelClass,
  authPrimaryBtnClass,
  authPrimaryBtnStyle,
} from "@/components/auth/auth-plate";
import { filterIdInput, type CountryIdDoc } from "@/lib/country-id-rules";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IdPhotoUpload } from "./id-photo-upload";
import { trialNote } from "./verify-helpers";

/** Tier 2 Country ID */
export function IdTierCard({
  isLight,
  card,
  ink,
  muted,
  userProfile,
  submitted,
  phoneOk,
  busy,
  idTypes,
  idType,
  idNumber,
  setIdNumber,
  idFront,
  idFrontName,
  idBack,
  idBackName,
  selectedDoc,
  changeIdType,
  pickIdFront,
  pickIdBack,
  onPhotoReadError,
  submitId,
}: {
  isLight: boolean;
  card: string;
  ink: string;
  muted: string;
  userProfile: UserProfile | null | undefined;
  submitted: boolean;
  phoneOk: boolean;
  busy: boolean;
  idTypes: CountryIdDoc[];
  idType: string;
  idNumber: string;
  setIdNumber: (v: string) => void;
  idFront: string;
  idFrontName: string;
  idBack: string;
  idBackName: string;
  selectedDoc: CountryIdDoc | undefined;
  changeIdType: (kind: string) => void;
  pickIdFront: (dataUrl: string, name: string) => void;
  pickIdBack: (dataUrl: string, name: string) => void;
  onPhotoReadError: () => void;
  submitId: () => Promise<void>;
}) {
  return (
    <section className={cn("rounded-xl px-3 py-3", card)}>
      <p className={cn("flex items-center gap-1.5 text-[12px] font-bold", ink)}>
        <Upload className="h-3.5 w-3.5 text-[#FF6B35]" />
        Tier 2 · Government ID
      </p>
      <p className={cn("mt-1 text-[11px] leading-snug", muted)}>
        {submitted
          ? "Submitted for Care review Full booking unlocks after approval"
          : "Upload a clear government ID for Care review"}
      </p>

      {submitted ? (
        <p className="mt-2 text-[11px] font-semibold leading-snug text-amber-600">
          Under review Full booking unlocks when Care approves your ID
          {trialNote(userProfile)}
        </p>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2.5">
          <div>
            <label className={cn(authLabelClass, "!mb-1 text-[11px]")}>
              ID type
            </label>
            <select
              className={cn(authFieldClass, "h-9 text-[12px]")}
              value={idType}
              onChange={(e) => changeIdType(e.target.value)}
              disabled={!phoneOk}
            >
              {idTypes.map((d) => (
                <option key={d.kind} value={d.kind}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn(authLabelClass, "!mb-1 text-[11px]")}>
              {selectedDoc?.label || "ID"} number
            </label>
            <input
              className={cn(authFieldClass, "h-9 text-[12px]")}
              value={idNumber}
              onChange={(e) =>
                setIdNumber(
                  selectedDoc
                    ? filterIdInput(e.target.value, selectedDoc)
                    : e.target.value,
                )
              }
              placeholder={selectedDoc?.placeholder || "ID number"}
              maxLength={selectedDoc?.maxLen ?? 32}
              inputMode={selectedDoc?.charset === "digits" ? "numeric" : "text"}
              disabled={!phoneOk}
            />
            {selectedDoc?.hint ? (
              <p className={cn("mt-0.5 text-[10px] leading-snug", muted)}>
                {selectedDoc.hint}
              </p>
            ) : null}
          </div>

          {/* gap: om-cta-dark-gray forces margin:0 */}
          <div className="flex flex-col gap-2">
            {selectedDoc?.needsFront !== false ? (
              <IdPhotoUpload
                isLight={isLight}
                phoneOk={phoneOk}
                dataUrl={idFront}
                fileName={idFrontName}
                buttonLabel={
                  idFrontName || idFront
                    ? `${selectedDoc?.needsBack ? "Front" : "Photo"}: ${idFrontName || "uploaded"}`
                    : selectedDoc?.needsBack
                      ? "Upload front of ID"
                      : "Upload ID photo (front only)"
                }
                previewLabel={selectedDoc?.needsBack ? "ID front" : "ID photo"}
                onPick={pickIdFront}
                onReadError={onPhotoReadError}
              />
            ) : null}

            {selectedDoc?.needsBack ? (
              <IdPhotoUpload
                isLight={isLight}
                phoneOk={phoneOk}
                dataUrl={idBack}
                fileName={idBackName}
                buttonLabel={
                  idBackName || idBack
                    ? `Back: ${idBackName || "uploaded"}`
                    : "Upload back of ID"
                }
                previewLabel="ID back"
                onPick={pickIdBack}
                onReadError={onPhotoReadError}
              />
            ) : null}

            <button
              type="button"
              disabled={busy || !phoneOk}
              onClick={() => void submitId()}
              className={cn(
                authPrimaryBtnClass,
                "!h-10 text-[13px] disabled:opacity-50",
              )}
              style={authPrimaryBtnStyle}
            >
              {busy ? "Submitting…" : "Submit ID for review"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
