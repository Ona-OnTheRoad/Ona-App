"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { CatalogPanel } from "@/components/admin/shop/catalog-panel";
import { OrdersPanel } from "@/components/admin/shop/orders-panel";
import { ShopTabs } from "@/components/admin/shop/shop-tabs";
import { useShopCatalog } from "@/components/admin/shop/use-shop-catalog";
import { useShopOrdersConsole } from "@/components/admin/shop/use-shop-orders-console";
import type { ShopTab } from "@/components/admin/shop/catalog-types";

export default function AdminShopPage() {
  const { adminName, ready, api } = useAdminGate();
  const [tab, setTab] = useState<ShopTab>("catalog");
  const catalog = useShopCatalog(api, ready, tab === "catalog");
  const orders = useShopOrdersConsole(api, ready, tab === "orders");

  return (
    <AdminShell
      adminName={adminName}
      title="Shop"
      subtitle="Catalog, orders, refunds, and delivery."
      guideKey="shop"
    >
      <ShopTabs currentTab={tab} onTabChange={setTab} />
      {tab === "catalog" ? (
        <CatalogPanel {...catalog} />
      ) : (
        <OrdersPanel {...orders} />
      )}
    </AdminShell>
  );
}
