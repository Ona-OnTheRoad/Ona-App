import {
  LayoutGrid,
  MessageCircle,
  Settings2,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NotificationFilter } from "@/lib/notifications/types";

export const FILTERS: {
  id: NotificationFilter;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "requests", label: "Requests", icon: Wrench },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "system", label: "System", icon: Settings2 },
];
