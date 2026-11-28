"use client";

import { useState } from "react";
import { ADMIN_FIELD_CLASS } from "./catalog-types";
import type { CourierProvider } from "./order-types";

export function CourierRegistry({
  providers,
  onChanged,
}: {
  providers: CourierProvider[];
  onChanged: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/shop/couriers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (!json?.ok) setErr(json?.error?.message || "Failed");
      else {
        setName("");
        setPhone("");
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (p: CourierProvider) => {
    await fetch("/api/admin/shop/couriers", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    await onChanged();
  };

  return (
    <div className="mt-6 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-[#27272a] dark:bg-[#0b0b0e]">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Courier providers
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Add delivery partners once; they appear as suggestions on each
          order&apos;s courier name field. Deactivate instead of deleting to
          keep history.
        </p>
      </div>
      <div className="px-6 pb-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className={`${ADMIN_FIELD_CLASS} max-w-[14rem]`}
            placeholder="Courier name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={`${ADMIN_FIELD_CLASS} max-w-[11rem]`}
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void add()}
            className="rounded-xl bg-ona-brand-btn px-3.5 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add provider"}
          </button>
        </div>
        {err ? <p className="mb-2 text-xs text-red-600">{err}</p> : null}
        <table className="w-full text-left text-xs">
          <tbody>
            {providers.map((p) => (
              <tr
                key={p.id}
                className="border-t border-gray-100 dark:border-[#27272a]"
              >
                <td className="py-2.5 pr-3 font-semibold text-gray-900 dark:text-white">
                  {p.name}
                </td>
                <td className="py-2.5 pr-3 text-gray-500">{p.phone || "—"}</td>
                <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300">
                  {p.active ? "active" : "inactive"}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => void toggle(p)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold dark:border-[#27272a]"
                  >
                    {p.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 ? (
              <tr>
                <td className="py-3 text-gray-500" colSpan={4}>
                  No providers yet — add your first courier above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
