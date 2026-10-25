import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type NotificationVariant = "primary" | "success" | "warning" | "danger" | "info";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  /** Bootstrap Icons class */
  icon: string;
  variant: NotificationVariant;
  createdAt: string;
  read: boolean;
  /** Route opened when the notification is clicked */
  link?: string;
};

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

// Prototype data until notifications come from the API.
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: nanoid(),
    title: "New quotation request",
    message: "A customer requested a new quotation.",
    icon: "bi-calculator",
    variant: "primary",
    createdAt: minutesAgo(4),
    read: false,
    link: "/quotation",
  },
  {
    id: nanoid(),
    title: "Search completed",
    message: "Your credit operations search finished.",
    icon: "bi-search",
    variant: "success",
    createdAt: minutesAgo(38),
    read: false,
    link: "/search",
  },
  {
    id: nanoid(),
    title: "News feed updated",
    message: "There are new company news to read.",
    icon: "bi-newspaper",
    variant: "info",
    createdAt: minutesAgo(180),
    read: false,
    link: "/news",
  },
  {
    id: nanoid(),
    title: "Secure your account",
    message: "Enable two-factor authentication.",
    icon: "bi-shield-lock",
    variant: "warning",
    createdAt: minutesAgo(60 * 26),
    read: true,
    link: "/settings#security",
  },
];

type NotificationsState = { items: AppNotification[] };

const initialState: NotificationsState = { items: MOCK_NOTIFICATIONS };

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items.unshift(action.payload);
      },
      prepare(
        notification: Omit<AppNotification, "id" | "createdAt" | "read">,
      ) {
        return {
          payload: {
            ...notification,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            read: false,
          },
        };
      },
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllNotificationsRead(state) {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
  },
});

type WithNotifications = { notifications: NotificationsState };
export const selectNotifications = (state: WithNotifications) =>
  state.notifications.items;
export const selectUnreadCount = (state: WithNotifications) =>
  state.notifications.items.filter((n) => !n.read).length;

export const {
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
