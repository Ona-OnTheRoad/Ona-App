import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MenuFooter({
  isLight,
  onClose,
}: {
  isLight: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const t = useT();
  return (
    <div
      className={cn(
        "shrink-0 border-t px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        isLight ? "border-black/10" : "border-white/10",
      )}
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          router.push("/logout");
        }}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg border-0 px-3 py-2 text-sm font-semibold shadow-none ring-0 outline-none",
          isLight
            ? "bg-red-500/18 text-red-700 hover:bg-red-500/28"
            : "bg-red-500/20 text-red-300 hover:bg-red-500/30",
        )}
      >
        <LogOut className="h-4 w-4" />
        {t("menu.logOut")}
      </button>
    </div>
  );
}
