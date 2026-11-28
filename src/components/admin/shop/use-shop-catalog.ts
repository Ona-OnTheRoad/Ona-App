"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { useAdminGate } from "@/components/admin/use-admin-gate";
import {
  EMPTY_CREATE_FORM,
  type CatalogProduct,
  type CategoryRow,
  type CreateProductForm,
  type ProductEditDetail,
} from "./catalog-types";
import {
  deleteProduct,
  fetchProductDetail,
  patchProductMeta,
  postCreateProduct,
  postProductImage,
  postProductPrice,
  postProductStock,
} from "./shop-catalog-writes";

type AdminApi = ReturnType<typeof useAdminGate>["api"];

export function useShopCatalog(api: AdminApi, ready: boolean, active: boolean) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [catalogQ, setCatalogQ] = useState("");
  const [catalogTrade, setCatalogTrade] = useState("");
  const [catalogListing, setCatalogListing] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [form, setForm] = useState<CreateProductForm>(EMPTY_CREATE_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDetail, setEditDetail] = useState<ProductEditDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [priceMajorEdit, setPriceMajorEdit] = useState("");
  const [stockEdit, setStockEdit] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "100" });
    if (catalogQ.trim()) params.set("q", catalogQ.trim());
    if (catalogTrade) params.set("trade", catalogTrade);
    if (catalogListing) params.set("listing", catalogListing);
    const res = await api<{
      products: CatalogProduct[];
      categories: CategoryRow[];
      setupRequired?: boolean;
      message?: string;
    }>(`/api/admin/shop/products?${params.toString()}`);
    if (!res.ok) {
      setError(res.message);
      setProducts([]);
      setLoading(false);
      return;
    }
    if (res.data.setupRequired) setSetupRequired(true);
    if (res.data.message) setMessage(res.data.message);
    setProducts(res.data.products ?? []);
    setCategories(res.data.categories ?? []);
    setLoading(false);
  }, [api, catalogQ, catalogTrade, catalogListing]);

  useEffect(() => {
    if (!ready || !active) return;
    void loadCatalog();
  }, [ready, active, loadCatalog]);

  const tradeOptions = useMemo(() => {
    const keys = new Set(categories.map((c) => c.trade_key));
    if (form.tradeKey) keys.add(form.tradeKey);
    return [...keys].sort();
  }, [categories, form.tradeKey]);

  const categoriesForTrade = useMemo(
    () =>
      categories.filter((c) => !form.tradeKey || c.trade_key === form.tradeKey),
    [categories, form.tradeKey],
  );

  const createProduct = async () => {
    setCreateBusy(true);
    setError(null);
    setMessage(null);
    const res = await postCreateProduct(api, form);
    setCreateBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Created: ${res.data.product?.name || form.name}`);
    setShowCreate(false);
    setForm((f) => ({
      ...EMPTY_CREATE_FORM,
      tradeKey: f.tradeKey,
      status: f.status,
      conditionType: f.conditionType,
    }));
    await loadCatalog();
  };

  const openEdit = async (id: string) => {
    setEditId(id);
    setEditDetail(null);
    setError(null);
    const res = await fetchProductDetail(api, id);
    if (!res.ok) {
      setError(res.message);
      setEditId(null);
      return;
    }
    setEditDetail(res.data);
    const price = res.data.prices?.[0];
    const inv = res.data.inventory?.[0];
    setPriceMajorEdit(price ? String(Number(price.amount_minor) / 100) : "");
    setStockEdit(inv ? String(inv.qty_on_hand ?? 0) : "0");
    setImageDataUrl(null);
  };

  const closeEdit = () => {
    setEditId(null);
    setEditDetail(null);
  };

  const saveAll = async () => {
    if (!editId || !editDetail?.variants?.[0]) return;
    setBusyId(editId);
    setError(null);
    const variantId = String(editDetail.variants[0].id);
    const okMeta = await patchProductMeta(api, editId, editDetail);
    if (!okMeta.ok) {
      setError(okMeta.message);
      setBusyId(null);
      return;
    }
    const okPrice = await postProductPrice(
      api,
      editId,
      variantId,
      priceMajorEdit,
    );
    if (!okPrice.ok) {
      setError(okPrice.message);
      setBusyId(null);
      return;
    }
    const okStock = await postProductStock(api, editId, variantId, stockEdit);
    setBusyId(null);
    if (!okStock.ok) {
      setError(okStock.message);
      return;
    }
    setMessage("Product saved");
    await openEdit(editId);
    await loadCatalog();
  };

  const uploadImage = async () => {
    if (!editId || !imageDataUrl) return;
    setBusyId(`img-${editId}`);
    const res = await postProductImage(api, editId, imageDataUrl);
    setBusyId(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage("Image uploaded");
    setImageDataUrl(null);
    await openEdit(editId);
    await loadCatalog();
  };

  const softDelete = async () => {
    if (!editId) return;
    if (!window.confirm("Archive this product (soft delete)?")) return;
    setBusyId(editId);
    const res = await deleteProduct(api, editId, false);
    setBusyId(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage("Product archived");
    closeEdit();
    await loadCatalog();
  };

  const hardDelete = async () => {
    if (!editId) return;
    if (
      !window.confirm(
        "Permanently delete this product? This cannot be undone.",
      )
    ) {
      return;
    }
    setBusyId(editId);
    const res = await deleteProduct(api, editId, true);
    setBusyId(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage("Product deleted");
    closeEdit();
    await loadCatalog();
  };

  return {
    products,
    categories,
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
  };
}
