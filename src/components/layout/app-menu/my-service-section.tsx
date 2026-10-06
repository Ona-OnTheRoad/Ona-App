import { Wrench } from "lucide-react";
import { useT } from "@/lib/i18n";
import { isProService } from "@/lib/pro-service-id";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import type { ProService } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MenuIcon, rowIdleClass } from "./menu-item-row";
import { TRADE_ICON_GLYPH, TRADE_LABEL_KEY } from "./menu-nav";

function TradeIcon({ service }: { service: ProService }) {
  const opt = PRO_TRADE_OPTIONS.find((t) => t.id === service);
  const Icon = opt?.icon ?? Wrench;
  return (
    <Icon
      className="h-3.5 w-3.5 shrink-0"
      strokeWidth={2}
      style={{ color: TRADE_ICON_GLYPH }}
      aria-hidden
    />
  );
}

export function MyServiceSection({
  isLight,
  proServices,
}: {
  isLight: boolean;
  proServices: ProService[];
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "mb-1.5 border-t pt-1.5",
        isLight ? "border-black/10" : "border-white/10",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-3.5 border-0 px-3 py-2.5 text-left text-[16px] font-medium tracking-[-0.01em]",
          rowIdleClass(isLight),
        )}
      >
        <MenuIcon name="service" isLight={isLight} />
        <span className="min-w-0 flex-1 leading-none">
          {t("menu.myService")}
        </span>
      </div>
      <div className="flex w-full items-center gap-2 px-3 py-0.5">
        <span
          className={cn(
            "min-w-0 flex-1 text-[12px] font-medium",
            isLight ? "text-black" : "text-white",
          )}
        >
          {isProService(proServices[0])
            ? t(TRADE_LABEL_KEY[proServices[0]])
            : proServices[0]}
        </span>
        {isProService(proServices[0]) ? (
          <TradeIcon service={proServices[0]} />
        ) : (
          <TradeIcon service="mechanic" />
        )}
      </div>
    </div>
  );
}
