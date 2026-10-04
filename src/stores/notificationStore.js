import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useNotificationStore = create(
  devtools(
    (set, get) => ({
      // State
      notifications: [],

      // Actions
      addNotification: (notification) =>
        set(
          (state) => ({
            notifications: [
              {
                id: notification.id || Date.now().toString() + Math.random(),
                type: notification.type || "info",
                message: notification.message,
                description: notification.description,
                timestamp: notification.timestamp || new Date().toISOString(),
              },
              ...state.notifications,
            ],
          }),
          false,
          "addNotification",
        ),

      removeNotification: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }),
          false,
          "removeNotification",
        ),

      clearNotifications: () =>
        set({ notifications: [] }, false, "clearNotifications"),

      // Auto-dismiss functionality
      scheduleNotificationRemoval: (id, delay = 5000) => {
        setTimeout(() => {
          get().removeNotification(id);
        }, delay);
      },
    }),
    {
      name: "notification-store", // DevTools name
    },
  ),
);

export default useNotificationStore;
