"use client";

import {
  ADMIN_FIELD_CLASS,
  canSubmitCreateProduct,
  type CategoryRow,
  type CreateProductForm,
} from "./catalog-types";

export function ProductCreateForm({
  form,
  onChange,
  tradeOptions,
  categoriesForTrade,
  busy,
  onSubmit,
}: {
  form: CreateProductForm;
  onChange: (next: CreateProductForm) => void;
  tradeOptions: string[];
  categoriesForTrade: CategoryRow[];
  busy: boolean;
  onSubmit: () => void;
}) {
  const canSubmit = canSubmitCreateProduct(form);
  const trades =
    tradeOptions.length > 0 ? tradeOptions : [form.tradeKey || "mechanic"];

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs p-5 sm:p-6 mb-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
        New product
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className={ADMIN_FIELD_CLASS}
          placeholder="Name *"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
        <input
          className={ADMIN_FIELD_CLASS}
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(e) => onChange({ ...form, subtitle: e.target.value })}
        />
        <select
          className={ADMIN_FIELD_CLASS}
          value={form.tradeKey}
          onChange={(e) =>
            onChange({ ...form, tradeKey: e.target.value, categoryId: "" })
          }
        >
          {trades.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={ADMIN_FIELD_CLASS}
          value={form.categoryId}
          onChange={(e) => onChange({ ...form, categoryId: e.target.value })}
        >
          <option value="">Category *</option>
          {categoriesForTrade.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.slug})
            </option>
          ))}
        </select>
        <input
          className={ADMIN_FIELD_CLASS}
          placeholder="SKU *"
          value={form.sku}
          onChange={(e) => onChange({ ...form, sku: e.target.value })}
        />
        <input
          className={ADMIN_FIELD_CLASS}
          placeholder="OEM number"
          value={form.oemNumber}
          onChange={(e) => onChange({ ...form, oemNumber: e.target.value })}
        />
        <input
          className={ADMIN_FIELD_CLASS}
          placeholder="Price ₦ major *"
          inputMode="decimal"
          value={form.priceMajor}
          onChange={(e) => onChange({ ...form, priceMajor: e.target.value })}
        />
        <input
          className={ADMIN_FIELD_CLASS}
          placeholder="Stock qty"
          inputMode="numeric"
          value={form.stockQty}
          onChange={(e) => onChange({ ...form, stockQty: e.target.value })}
        />
        <select
          className={ADMIN_FIELD_CLASS}
          value={form.status}
          onChange={(e) =>
            onChange({
              ...form,
              status: e.target.value as CreateProductForm["status"],
            })
          }
        >
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
        <select
          className={ADMIN_FIELD_CLASS}
          value={form.conditionType}
          onChange={(e) =>
            onChange({ ...form, conditionType: e.target.value })
          }
        >
          <option value="original">original</option>
          <option value="aftermarket">aftermarket</option>
          <option value="used">used</option>
        </select>
        <textarea
          className={`${ADMIN_FIELD_CLASS} sm:col-span-2 min-h-18`}
          placeholder="Description"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={onSubmit}
        className="mt-4 px-4 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
      >
        {busy ? "Creating…" : "Create product"}
      </button>
    </div>
  );
}
