import type { MenuItemOverride } from "@/lib/app-config";
import { NAV_SCHEMA } from "@/lib/nav-schema";

/**
 * Structured menu override editor: lists ONLY rows that exist in the compiled
 * app nav (NAV_SCHEMA). Admin can hide / reorder / relabel, never invent or
 * delete rows, so the app sidebar can never lose a menu by config accident.
 */
export function MenuOverrideEditor({
  title,
  schemaRole,
  overrides,
  onChange,
  onError,
}: {
  title: string;
  schemaRole: "client" | "pro";
  overrides: Record<string, MenuItemOverride>;
  onChange: (next: Record<string, MenuItemOverride>) => void;
  onError: (m: string | null) => void;
}) {
  const rows = NAV_SCHEMA.filter((r) => r.role === schemaRole);
  const update = (id: string, patch: MenuItemOverride) => {
    const clean: MenuItemOverride = {};
    if (patch.hidden) clean.hidden = true;
    if (typeof patch.order === "number" && !Number.isNaN(patch.order))
      clean.order = patch.order;
    if (patch.label && patch.label.trim()) clean.label = patch.label.trim();
    onChange({ ...overrides, [id]: clean });
    onError(null);
  };
  return (
    <fieldset
      style={{
        border: "1px solid var(--om-border, #ccc)",
        borderRadius: 8,
        padding: "0.75rem",
        margin: 0,
      }}
    >
      <legend style={{ fontWeight: 600, fontSize: 13 }}>{title}</legend>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 4 }}>Visible</th>
            <th style={{ textAlign: "left", padding: 4 }}>Row</th>
            <th style={{ textAlign: "left", padding: 4 }}>Order</th>
            <th style={{ textAlign: "left", padding: 4 }}>Label override</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ov = overrides[row.id] || {};
            const protectedRow =
              row.id === "home" ||
              row.id === "dashboard" ||
              row.id === "settings";
            return (
              <tr key={`${schemaRole}-${row.id}`}>
                <td style={{ padding: 4 }}>
                  <input
                    type="checkbox"
                    checked={!ov.hidden}
                    disabled={protectedRow}
                    onChange={(e) =>
                      update(row.id, { ...ov, hidden: !e.target.checked })
                    }
                  />
                </td>
                <td style={{ padding: 4 }}>
                  {row.label}
                  {protectedRow ? " (always visible)" : ""}
                </td>
                <td style={{ padding: 4 }}>
                  <input
                    type="number"
                    value={ov.order ?? ""}
                    placeholder="default"
                    style={{ width: 80 }}
                    onChange={(e) =>
                      update(row.id, {
                        ...ov,
                        order:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td style={{ padding: 4 }}>
                  <input
                    type="text"
                    value={ov.label ?? ""}
                    placeholder={row.label}
                    style={{ width: "100%" }}
                    onChange={(e) =>
                      update(row.id, { ...ov, label: e.target.value })
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </fieldset>
  );
}
