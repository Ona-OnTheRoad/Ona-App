import type { Dispatch, SetStateAction } from "react";
import type { MatchingSection, VerificationSection } from "@/lib/app-config";
import { PlainForm } from "@/components/admin/shared-lists/plain-form";

export function MatchingPanel({
  matching,
  setMatching,
}: {
  matching: MatchingSection | null;
  setMatching: Dispatch<SetStateAction<MatchingSection | null>>;
}) {
  return (
    <div className="om-admin-panel">
      <div className="om-admin-toolbar">
        <strong>Matching</strong>
      </div>
      <div style={{ padding: "1rem" }}>
        {!matching ? (
          <p className="om-admin-muted">Loading…</p>
        ) : (
          <PlainForm>
            <label>
              Max search radius (km)
              <input
                type="number"
                min={1}
                max={5}
                value={matching.maxRadiusKm}
                onChange={(e) =>
                  setMatching({
                    ...matching,
                    maxRadiusKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Default radius (km)
              <input
                type="number"
                min={1}
                max={5}
                value={matching.defaultRadiusKm}
                onChange={(e) =>
                  setMatching({
                    ...matching,
                    defaultRadiusKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Max technicians shown
              <input
                type="number"
                min={5}
                max={200}
                value={matching.maxTechnicians}
                onChange={(e) =>
                  setMatching({
                    ...matching,
                    maxTechnicians: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Min rating filter (0 = off)
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={matching.minRatingFilter}
                onChange={(e) =>
                  setMatching({
                    ...matching,
                    minRatingFilter: Number(e.target.value),
                  })
                }
              />
            </label>
          </PlainForm>
        )}
      </div>
    </div>
  );
}

export function VerificationPanel({
  verification,
  setVerification,
}: {
  verification: VerificationSection | null;
  setVerification: Dispatch<SetStateAction<VerificationSection | null>>;
}) {
  return (
    <div className="om-admin-panel">
      <div className="om-admin-toolbar">
        <strong>Verification gate</strong>
      </div>
      <div style={{ padding: "1rem" }}>
        {!verification ? (
          <p className="om-admin-muted">Loading…</p>
        ) : (
          <PlainForm>
            <label>
              Warn from action #
              <input
                type="number"
                min={1}
                max={20}
                value={verification.warnFrom}
                onChange={(e) =>
                  setVerification({
                    ...verification,
                    warnFrom: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Block at action #
              <input
                type="number"
                min={1}
                max={30}
                value={verification.blockAt}
                onChange={(e) =>
                  setVerification({
                    ...verification,
                    blockAt: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="om-admin-switch">
              <input
                type="checkbox"
                checked={verification.requireNin}
                onChange={(e) =>
                  setVerification({
                    ...verification,
                    requireNin: e.target.checked,
                  })
                }
              />
              Require NIN
            </label>
            <label className="om-admin-switch">
              <input
                type="checkbox"
                checked={verification.requireBvn}
                onChange={(e) =>
                  setVerification({
                    ...verification,
                    requireBvn: e.target.checked,
                  })
                }
              />
              Require BVN
            </label>
          </PlainForm>
        )}
      </div>
    </div>
  );
}
