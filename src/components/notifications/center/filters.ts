import type { NotificationFilter } from "@/lib/notifications/types";

/** Filter chips (Ona UI v2 labels; ids are the existing categories). */
export const FILTERS: {
  id: NotificationFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "requests", label: "Service" },
  { id: "messages", label: "Comment" },
  { id: "payments", label: "Wallet" },
  { id: "system", label: "System" },
];

