"use client";

import { DetailDrawer } from "@/components/admin/admin-ui";
import {
  ADMIN_FIELD_CLASS,
  availabilityLabel,
  type ProductEditDetail,
} from "./catalog-types";

export function ProductEditDrawer({
  open,
  detail,
  busyId,
  editId,
  priceMajorEdit,
  stockEdit,
  imageDataUrl,
  onClose,
  onSaveAll,
  onUploadImage,
  onSoftDelete,
  onHardDelete,
  onDetailChange,
  onPriceChange,
  onStockChange,
  onImageChange,
}: {
  open: boolean;
  detail: ProductEditDetail | null;
  busyId: string | null;
  editId: string | null;
  priceMajorEdit: string;
  stockEdit: string;
  imageDataUrl: string | null;
  onClose: () => void;
  onSaveAll: () => void;
  onUploadImage: () => void;
  onSoftDelete: () => void;
  onHardDelete: () => void;
  onDetailChange: (next: ProductEditDetail) => void;
  onPriceChange: (v: string) => void;
  onStockChange: (v: string) => void;
  onImageChange: (dataUrl: string | null) => void;
}) {
  const saving = Boolean(editId && busyId === editId);
  const avail = availabilityLabel(Number(stockEdit) || 0);

  return (
    <DetailDrawer
      open={open}
      title="Edit product"
      subtitle="Details, price, stock, and image"
      width={480}
      onClose={onClose}
      headerAction={
        <button
          type="button"
          disabled={!detail || saving}
          onClick={onSaveAll}
          className="px-3 py-1.5 rounded-lg bg-[#323231] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      {!detail ? (
        <p className="text-xs text-gray-500">Loading product…</p>
      ) : (
        <div className="space-y-3 text-xs">
          <span
            className={`inline-flex text-[11px] font-bold rounded-full px-2.5 py-1 ${avail.className}`}
          >
            {avail.label}
          </span>

          <section className="rounded-xl border border-gray-200 dark:border-[#27272a] p-3 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Availability
            </h3>
            <select
              className={ADMIN_FIELD_CLASS}
              value={String(detail.product.listing_override ?? "auto")}
              onChange={(e) =>
                onDetailChange({
                  ...detail,
                  product: {
                    ...detail.product,
                    listing_override:
                      e.target.value === "auto" ? null : e.target.value,
                  },
                })
              }
            >
              <option value="auto">Auto, from stock count</option>
              <option value="available">Available</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="pre_order">Pre-order</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-[#27272a] p-3 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Details
            </h3>
            <input
              className={ADMIN_FIELD_CLASS}
              value={String(detail.product.name || "")}
              onChange={(e) =>
                onDetailChange({
                  ...detail,
                  product: { ...detail.product, name: e.target.value },
                })
              }
              placeholder="Product name"
            />
            <input
              className={ADMIN_FIELD_CLASS}
              value={String(detail.product.subtitle || "")}
              onChange={(e) =>
                onDetailChange({
                  ...detail,
                  product: { ...detail.product, subtitle: e.target.value },
                })
              }
              placeholder="Subtitle"
            />
            <textarea
              className={`${ADMIN_FIELD_CLASS} min-h-18`}
              value={String(detail.product.description || "")}
              onChange={(e) =>
                onDetailChange({
                  ...detail,
                  product: { ...detail.product, description: e.target.value },
                })
              }
              placeholder="Description"
            />
            <select
              className={ADMIN_FIELD_CLASS}
              value={String(detail.product.status || "active")}
              onChange={(e) =>
                onDetailChange({
                  ...detail,
                  product: { ...detail.product, status: e.target.value },
                })
              }
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select
              className={ADMIN_FIELD_CLASS}
              value={String(detail.product.condition_type || "original")}
              onChange={(e) =>
                onDetailChange({
                  ...detail,
                  product: {
                    ...detail.product,
                    condition_type: e.target.value,
                  },
                })
              }
            >
              <option value="original">original</option>
              <option value="aftermarket">aftermarket</option>
              <option value="used">used</option>
            </select>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-[#27272a] p-3 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Price & stock
            </h3>
            <input
              className={ADMIN_FIELD_CLASS}
              inputMode="decimal"
              value={priceMajorEdit}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="Price ₦ major"
            />
            <input
              className={ADMIN_FIELD_CLASS}
              inputMode="numeric"
              value={stockEdit}
              onChange={(e) => onStockChange(e.target.value)}
              placeholder="Stock qty"
            />
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-[#27272a] p-3 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Image
            </h3>
            <input
              type="file"
              accept="image/*"
              className="text-xs text-gray-600 dark:text-gray-300"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  onImageChange(null);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  onImageChange(
                    typeof reader.result === "string" ? reader.result : null,
                  );
                };
                reader.readAsDataURL(file);
              }}
            />
            <button
              type="button"
              disabled={!imageDataUrl || busyId === `img-${editId}`}
              onClick={onUploadImage}
              className="px-3 py-1.5 rounded-lg bg-ona-brand-btn text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busyId === `img-${editId}` ? "Uploading…" : "Upload"}
            </button>
          </section>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onSoftDelete}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#27272a] text-xs font-semibold cursor-pointer"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={onHardDelete}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold cursor-pointer"
            >
              Delete forever
            </button>
          </div>
        </div>
      )}
    </DetailDrawer>
  );
}
