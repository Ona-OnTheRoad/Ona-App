import { Wrench } from "lucide-react";
import { useT } from "@/lib/i18n";
import { isProService } from "@/lib/pro-service-id";
import { PRO_TRADE_OPTIONS } from "@/lib/services";
import type { ProService } from "@/lib/types";
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
  proServices,
}: {
  proServices: ProService[];
}) {
  const t = useT();
  const first = proServices[0];
  return (
    <div className="flex items-center gap-2 rounded-ona-ctl bg-ona-field px-3 py-2.5">
      <span className="text-[12px] font-semibold text-ona-muted">
        {t("menu.myService")}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-[13px] font-semibold text-ona-ink">
        {isProService(first) ? t(TRADE_LABEL_KEY[first]) : first}
      </span>
      <TradeIcon service={isProService(first) ? first : "mechanic"} />
    </div>
  );
}
