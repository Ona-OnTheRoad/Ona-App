import type { useAdminGate } from "@/components/admin/use-admin-gate";
import type {
  CatalogProduct,
  CreateProductForm,
  ProductEditDetail,
} from "./catalog-types";

type AdminApi = ReturnType<typeof useAdminGate>["api"];

export async function postCreateProduct(
  api: AdminApi,
  form: CreateProductForm,
) {
  return api<{ product: CatalogProduct }>("/api/admin/shop/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.name,
      subtitle: form.subtitle || null,
      description: form.description || null,
      tradeKey: form.tradeKey,
      categoryId: form.categoryId,
      sku: form.sku,
      oemNumber: form.oemNumber || null,
      priceMajor: Number(form.priceMajor),
      stockQty: Number(form.stockQty || 0),
      status: form.status,
      conditionType: form.conditionType || null,
    }),
  });
}

export async function fetchProductDetail(api: AdminApi, id: string) {
  return api<ProductEditDetail>(`/api/admin/shop/products/${id}`);
}

export async function patchProductMeta(
  api: AdminApi,
  editId: string,
  detail: ProductEditDetail,
) {
  const p = detail.product;
  return api(`/api/admin/shop/products/${editId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      status: p.status,
      conditionType: p.condition_type,
      tradeKey: p.trade_key,
      categoryId: p.category_id,
      listingOverride: p.listing_override ?? null,
    }),
  });
}

export async function postProductPrice(
  api: AdminApi,
  editId: string,
  variantId: string,
  priceMajorEdit: string,
) {
  return api(`/api/admin/shop/products/${editId}/price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variantId,
      priceMajor: Number(priceMajorEdit),
    }),
  });
}

export async function postProductStock(
  api: AdminApi,
  editId: string,
  variantId: string,
  stockEdit: string,
) {
  return api(`/api/admin/shop/products/${editId}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variantId,
      qtyOnHand: Number(stockEdit),
    }),
  });
}

export async function postProductImage(
  api: AdminApi,
  editId: string,
  imageDataUrl: string,
) {
  return api(`/api/admin/shop/products/${editId}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl, setPrimary: true }),
  });
}

export async function deleteProduct(
  api: AdminApi,
  editId: string,
  hard: boolean,
) {
  const qs = hard ? "?hard=1" : "";
  return api(`/api/admin/shop/products/${editId}${qs}`, { method: "DELETE" });
}
