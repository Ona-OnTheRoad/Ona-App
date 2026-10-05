import type {
  AppNotification,
  NotificationFilter,
} from "@/lib/notifications/types";

export type ToastItem = {
  id: string;
  notification: AppNotification;
  expiresAt: number;
};

export type Ctx = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  centerOpen: boolean;
  openCenter: () => void;
  closeCenter: () => void;
  filter: NotificationFilter;
  setFilter: (f: NotificationFilter) => void;
  search: string;
  setSearch: (q: string) => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  filtered: AppNotification[];
  /** Demo: push a local notification (dev / QA) */
  pushLocal: (
    n: Omit<AppNotification, "id" | "userId" | "createdAt"> & {
      id?: string;
      createdAt?: string;
    },
  ) => void;
};
