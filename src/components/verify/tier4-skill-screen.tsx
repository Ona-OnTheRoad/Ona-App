"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { toastSuccess, toastError } from "@/lib/toast";
import { useApp } from "@/lib/store";

const CERT_TYPES = [
  "Trade Test Certificate",
  "Apprenticeship Certificate",
  "Vocational Training Diploma",
  "Professional License",
  "Other Certification",
] as const;

export function Tier4SkillScreen() {
  const router = useRouter();
  const { accountType, updateUserProfile, userProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileRecord = userProfile as unknown as Record<string, unknown> | null;
  const [certType, setCertType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(
    Boolean(profileRecord?.skillProof || profileRecord?.tier4Status === "under_review" || profileRecord?.skillProofStatus === "under_review"),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toastError("Please select a valid image (PNG or JPG) or PDF");
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certType) {
      toastError("Please select a certificate type");
      return;
    }
    if (!selectedFile && !profileRecord?.skillProof) {
      toastError("Please upload your certificate file");
      return;
    }

    setSubmitting(true);
    try {
      // Simulate/persist file metadata into user profile
      const fileName = selectedFile?.name || "certificate.png";
      const err = updateUserProfile({
        skillProof: {
          name: fileName,
          url: URL.createObjectURL(selectedFile || new Blob()),
          uploadedAt: new Date().toISOString(),
        },
        skillProofStatus: "under_review",
      } as unknown as Parameters<typeof updateUserProfile>[0]);

      if (err) {
        toastError(err);
      } else {
        setSubmitted(true);
        toastSuccess("Skill certificate submitted for review");
        setTimeout(() => {
          navigateBack(router, "/verify", accountType);
        }, 1200);
      }
    } catch {
      toastError("Failed to upload certificate. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto flex min-h-full flex-col justify-between px-4 pb-8 pt-3">
        <div>
          {/* Back button */}
          <div className="flex items-center mb-3">
            <button
              type="button"
              onClick={() => navigateBack(router, "/verify", accountType)}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Back to Verification"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
            Tier 4: Proof of skill
          </h1>
          <p className="mt-1 text-[13px] text-ona-muted">
            Upload proof of skill for Tier 4 review.
          </p>

          {/* Form */}
          <form id="tier4-form" onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Certificate Type */}
            <div>
              <label
                htmlFor="cert-type"
                className="block text-[13px] font-semibold text-ona-ink mb-1.5"
              >
                Certificate type
              </label>
              <div className="relative">
                <select
                  id="cert-type"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full appearance-none rounded-ona-ctl border border-ona-border bg-ona-surface px-3.5 py-3 pr-10 text-[13px] text-ona-ink outline-none transition-colors focus:border-brand"
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  {CERT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ona-muted"
                  strokeWidth={2}
                />
              </div>
            </div>

            {/* Upload Certificate */}
            <div>
              <label className="block text-[13px] font-semibold text-ona-ink mb-1.5">
                Upload certificate <span className="text-red-500">*</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center rounded-ona-ctl border border-ona-border bg-ona-field overflow-hidden cursor-pointer hover:border-brand/60 transition-colors"
              >
                <button
                  type="button"
                  tabIndex={-1}
                  className="shrink-0 border-r border-ona-border bg-ona-surface px-3.5 py-2.5 text-[12px] font-medium text-ona-ink"
                >
                  Choose files
                </button>
                <span className="truncate px-3 text-[12px] text-ona-muted">
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <p className="mt-1.5 text-[11px] text-ona-muted">
                PNG or JPG (MAX. 800×400px).
              </p>
            </div>

            {submitted && (
              <div className="rounded-ona-card border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-2.5 text-[12px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Submitted and currently under review</span>
              </div>
            )}
          </form>
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-8 pb-4">
          <button
            type="submit"
            form="tier4-form"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-ona-card bg-[#ea580c] hover:bg-[#d94e08] active:scale-[0.99] font-bold text-sm text-white shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Submit skill for review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
