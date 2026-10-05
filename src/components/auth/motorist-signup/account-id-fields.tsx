import {
  authFieldClass as fieldClass,
  authLockedFieldClass,
  authLockedFieldStyle,
} from "@/components/auth/auth-plate";
import { filterIdInput, validateIdFormat } from "@/lib/country-id-rules";
import { cn } from "@/lib/utils";
import { Field, FieldHint } from "./form-parts";
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
        <Field label={primaryDoc.label}>
          <input
            className={cn(fieldClass, ninLocked && authLockedFieldClass)}
            style={ninLocked ? authLockedFieldStyle : undefined}
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
          <p className="mt-0.5 text-[10px] font-medium text-[#64748b]">
            {idPack.countryName}: {primaryDoc.hint} You can finish this later in
            Verify.
          </p>
          <FieldHint message={fieldErrors.nin} />
        </Field>
      ) : null}

      {bankDoc ? (
        <Field label={bankDoc.label}>
          <input
            className={cn(fieldClass, bvnLocked && authLockedFieldClass)}
            style={bvnLocked ? authLockedFieldStyle : undefined}
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
          <p className="mt-0.5 text-[10px] font-medium text-[#64748b]">
            {bankDoc.hint}
          </p>
          <FieldHint message={fieldErrors.bvn} />
        </Field>
      ) : null}
    </>
  );
}
