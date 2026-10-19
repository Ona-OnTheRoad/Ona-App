import {
  Car,
  CircleDot,
  Cpu,
  Fan,
  Grid2x2,
  Hammer,
  Paintbrush,
  PaintRoller,
  Plug,
  Scissors,
  ShowerHead,
  Sun,
  Wrench,
  Zap,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import { CarBattery } from "@/lib/services";
import type { ServiceCategory } from "@/lib/types";

export type TradeTile = {
  id: ServiceCategory;
  labelKey: MessageKey;
  icon: typeof Wrench;
};

/** All shipped trades, in design order. The last tile ("all") is ONA Shop. */
export const TRADE_TILES: TradeTile[] = [
  { id: "mechanic", labelKey: "trade.mechanic", icon: Wrench },
  { id: "vulcanizer", labelKey: "trade.vulcanizer", icon: CircleDot },
  { id: "towing", labelKey: "trade.towing", icon: Car },
  { id: "battery", labelKey: "trade.battery", icon: CarBattery },
  { id: "ac", labelKey: "trade.ac", icon: Fan },
  { id: "body", labelKey: "trade.body", icon: Paintbrush },
  { id: "electrical", labelKey: "trade.electrical", icon: Plug },
  { id: "diagnostics", labelKey: "trade.diagnostics", icon: Cpu },
  { id: "fashion", labelKey: "trade.fashion", icon: Scissors },
  { id: "plumber", labelKey: "trade.plumber", icon: ShowerHead },
  { id: "carpenter", labelKey: "trade.carpenter", icon: Hammer },
  { id: "painter", labelKey: "trade.painter", icon: PaintRoller },
  { id: "solar", labelKey: "trade.solar", icon: Sun },
  { id: "generator", labelKey: "trade.generator", icon: Zap },
  /** Replaces former "All": opens ONA Shop (repair commerce) */
  { id: "all", labelKey: "trade.shop", icon: Grid2x2 },
];
