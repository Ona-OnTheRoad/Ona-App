import { OnaField, OnaInput } from "@/components/ui/ona-field";
import { filterIdInput, validateIdFormat } from "@/lib/country-id-rules";
import { cn } from "@/lib/utils";
import type { MotoristFields } from "./use-motorist-fields";

/** Optional government ID (e.g. NIN) and bank ID (e.g. BVN) inputs. */
export function AccountIdFields({ f }: { f: MotoristFields }) {
  const {
    fieldErrors,
    setFieldError,
    idPack,
    primaryDoc,
    bankDoc,
    idNumber,
    setIdNumber,
    bvn,
    setBvn,
    ninLocked,
    bvnLocked,
  } = f;
  return (
    <>
      {primaryDoc ? (
        <OnaField
          label={`${primaryDoc.label} (optional)`}
          error={fieldErrors.nin}
          hint={`${idPack.countryName}: ${primaryDoc.hint} You can finish this later in Verify.`}
        >
          {({ id, describedBy, invalid }) => (
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              className={cn(ninLocked && "cursor-not-allowed opacity-60")}
              value={idNumber}
              readOnly={ninLocked}
              tabIndex={ninLocked ? -1 : undefined}
              onChange={(e) => {
                if (ninLocked) return;
                setIdNumber(filterIdInput(e.target.value, primaryDoc));
                setFieldError("nin", null);
              }}
              onBlur={() => {
                if (!idNumber.trim()) {
                  setFieldError("nin", null);
                  return;
                }
                const r = validateIdFormat(idNumber, primaryDoc);
                setFieldError("nin", r.ok ? null : r.message);
              }}
              placeholder={primaryDoc.placeholder}
              inputMode={primaryDoc.charset === "digits" ? "numeric" : "text"}
              maxLength={primaryDoc.maxLen}
            />
          )}
        </OnaField>
      ) : null}

      {bankDoc ? (
        <OnaField
          label={`${bankDoc.label} (optional)`}
          error={fieldErrors.bvn}
          hint={bankDoc.hint}
        >
          {({ id, describedBy, invalid }) => (
            <OnaInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              className={cn(bvnLocked && "cursor-not-allowed opacity-60")}
              value={bvn}
              readOnly={bvnLocked}
              tabIndex={bvnLocked ? -1 : undefined}
              onChange={(e) => {
                if (bvnLocked) return;
                setBvn(filterIdInput(e.target.value, bankDoc));
                setFieldError("bvn", null);
              }}
              onBlur={() => {
                if (!bvn.trim()) {
                  setFieldError("bvn", null);
                  return;
                }
                const r = validateIdFormat(bvn, bankDoc);
                setFieldError("bvn", r.ok ? null : r.message);
              }}
              placeholder={bankDoc.placeholder}
              inputMode={bankDoc.charset === "digits" ? "numeric" : "text"}
              maxLength={bankDoc.maxLen}
            />
          )}
        </OnaField>
      ) : null}
    </>
  );
}
