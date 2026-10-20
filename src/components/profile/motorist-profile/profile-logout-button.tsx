"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProfileLogoutButtonProps {
  isLight?: boolean;
  className?: string;
}

export function ProfileLogoutButton({
  className,
}: ProfileLogoutButtonProps) {
  const router = useRouter();
  const { t } = useI18n();

  const handleLogout = () => {
    router.push("/logout");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-ona-ctl border border-ona-danger/20 bg-red-500/10 text-ona-danger hover:bg-red-500/15 py-3.5 px-4 text-[14px] font-bold transition-all active:scale-[0.99] cursor-pointer",
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      <span>{t("auth.signOut") || "Log Out"}</span>
    </button>
  );
}
