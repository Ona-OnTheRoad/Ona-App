import { ChevronRight } from "lucide-react";
import { authSecondaryBtnClass } from "@/components/auth/auth-plate";
import type { Step } from "./types";

/** Footer dark gray #323231 matching "Continue to sign up" */
export function SignupFooter({
  step,
  step1Ok,
  step2Ok,
  busy,
  onNext,
  onFinish,
}: {
  step: Step;
  step1Ok: boolean;
  step2Ok: boolean;
  busy: boolean;
  onNext: () => void;
  onFinish: (opts?: { skipVehicle?: boolean }) => void;
}) {
  return (
    <div className="mx-auto flex w-[80%] shrink-0 flex-col gap-2 pb-4 pt-2">
      {step < 3 ? (
        <button
          type="button"
          className="om-cta-dark-gray"
          /* Full inline lock same dark gray as previous page Continue CTA */
          style={{
            WebkitAppearance: "none",
            appearance: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            height: 44,
            margin: 0,
            padding: "0 16px",
            border: "none",
            borderRadius: 6,
            background: "#323231",
            backgroundColor: "#323231",
            backgroundImage: "none",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            cursor: (step === 1 ? step1Ok : step2Ok)
              ? "pointer"
              : "not-allowed",
            opacity: 1,
            filter: "none",
          }}
          data-cta="next"
          onClick={onNext}
        >
          Next
          <ChevronRight
            className="h-4 w-4 shrink-0"
            color="#ffffff"
            strokeWidth={2.4}
          />
        </button>
      ) : (
        <>
          <button
            type="button"
            className="om-cta-dark-gray"
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: 44,
              margin: 0,
              border: "none",
              borderRadius: 6,
              background: "#323231",
              backgroundColor: "#323231",
              backgroundImage: "none",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              cursor: busy ? "wait" : "pointer",
              opacity: 1,
            }}
            disabled={busy}
            onClick={() => onFinish()}
          >
            {busy ? "Please wait…" : "Create my account"}
          </button>
          <button
            type="button"
            className={authSecondaryBtnClass}
            disabled={busy}
            onClick={() => onFinish({ skipVehicle: true })}
          >
            Skip vehicle. Finish
          </button>
        </>
      )}
    </div>
  );
}
