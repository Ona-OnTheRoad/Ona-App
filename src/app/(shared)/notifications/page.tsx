"use client";

import { useRouter } from "next/navigation";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { defaultBackHref, navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

export default function NotificationsPage() {
  const router = useRouter();
  const { accountType } = useApp();
  const home = defaultBackHref(accountType);

  const handleBack = () => {
    navigateBack(router, home, accountType);
  };

  return <NotificationsView onBack={handleBack} standalone />;
}
