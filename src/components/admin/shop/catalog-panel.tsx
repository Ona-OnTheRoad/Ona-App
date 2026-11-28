"use client";

import { ADMIN_FIELD_CLASS } from "./catalog-types";
import { CatalogTable } from "./catalog-table";
import { ProductCreateForm } from "./product-create-form";
import { ProductEditDrawer } from "./product-edit-drawer";
import type { useShopCatalog } from "./use-shop-catalog";

type CatalogState = ReturnType<typeof useShopCatalog>;

export function CatalogPanel(props: CatalogState) {
  const {
    products,
    loading,
    setupRequired,
    error,
    message,
    catalogQ,
    setCatalogQ,
    catalogTrade,
    setCatalogTrade,
    catalogListing,
    setCatalogListing,
    showCreate,
    setShowCreate,
    createBusy,
    form,
    setForm,
    tradeOptions,
    categoriesForTrade,
    loadCatalog,
    createProduct,
    editId,
    editDetail,
    setEditDetail,
    busyId,
    priceMajorEdit,
    setPriceMajorEdit,
    stockEdit,
    setStockEdit,
    imageDataUrl,
    setImageDataUrl,
    openEdit,
    closeEdit,
    saveAll,
    uploadImage,
    softDelete,
    hardDelete,
  } = props;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="px-3.5 py-1.5 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer shadow-xs"
        >
          {showCreate ? "Cancel create" : "+ New product"}
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {products.length} product(s)
        </span>
      </div>

      {error ? (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</div>
      ) : null}
      {message ? (
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{message}</p>
      ) : null}
      {setupRequired ? (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">
          Apply shop migrations 050 + 051, then seed categories before creating
          products.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className={`${ADMIN_FIELD_CLASS} max-w-xs`}
          placeholder="Search name / slug…"
          value={catalogQ}
          onChange={(e) => setCatalogQ(e.target.value)}
        />
        <select
          className={`${ADMIN_FIELD_CLASS} max-w-[10rem]`}
          value={catalogTrade}
          onChange={(e) => setCatalogTrade(e.target.value)}
        >
          <option value="">All trades</option>
          {tradeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={`${ADMIN_FIELD_CLASS} max-w-[12rem]`}
          value={catalogListing}
          onChange={(e) => setCatalogListing(e.target.value)}
        >
          <option value="">All availability</option>
          <option value="available">Available</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="pre_order">Pre-order</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
        <button
          type="button"
          onClick={() => void loadCatalog()}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-[#27272a] text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
        >
          Filter
        </button>
      </div>

      {showCreate ? (
        <ProductCreateForm
          form={form}
          onChange={setForm}
          tradeOptions={tradeOptions}
          categoriesForTrade={categoriesForTrade}
          busy={createBusy}
          onSubmit={() => void createProduct()}
        />
      ) : null}

      <CatalogTable
        products={products}
        loading={loading}
        onRefresh={() => void loadCatalog()}
        onEdit={(id) => void openEdit(id)}
      />

      <ProductEditDrawer
        open={Boolean(editId)}
        detail={editDetail}
        busyId={busyId}
        editId={editId}
        priceMajorEdit={priceMajorEdit}
        stockEdit={stockEdit}
        imageDataUrl={imageDataUrl}
        onClose={closeEdit}
        onSaveAll={() => void saveAll()}
        onUploadImage={() => void uploadImage()}
        onSoftDelete={() => void softDelete()}
        onHardDelete={() => void hardDelete()}
        onDetailChange={setEditDetail}
        onPriceChange={setPriceMajorEdit}
        onStockChange={setStockEdit}
        onImageChange={setImageDataUrl}
      />
    </div>
  );
}
