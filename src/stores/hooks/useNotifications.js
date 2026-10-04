import useNotificationStore from "../notificationStore";

// Custom hook for notification management with common patterns
export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    scheduleNotificationRemoval,
  } = useNotificationStore();

  // Helper functions for common notification types
  const notifySuccess = (message, description, autoDismiss = true) => {
    const notification = {
      type: "success",
      message,
      description,
    };
    addNotification(notification);

    if (autoDismiss) {
      const id = notification.id || Date.now().toString() + Math.random();
      scheduleNotificationRemoval(id, 5000);
    }
  };

  const notifyError = (message, description, autoDismiss = false) => {
    const notification = {
      type: "error",
      message,
      description,
    };
    addNotification(notification);

    if (autoDismiss) {
      const id = notification.id || Date.now().toString() + Math.random();
      scheduleNotificationRemoval(id, 7000); // Errors stay longer
    }
  };

  const notifyInfo = (message, description, autoDismiss = true) => {
    const notification = {
      type: "info",
      message,
      description,
    };
    addNotification(notification);

    if (autoDismiss) {
      const id = notification.id || Date.now().toString() + Math.random();
      scheduleNotificationRemoval(id, 5000);
    }
  };

  const notifyAchievement = (title, description) => {
    const notification = {
      type: "achievement",
      message: `🏆 Achievement Unlocked: ${title}!`,
      description,
    };
    addNotification(notification);
    scheduleNotificationRemoval(notification.id, 7000); // Achievements stay longer
  };

  return {
    // State
    notifications,

    // Core actions
    addNotification,
    removeNotification,
    clearNotifications,

    // Helper functions
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyAchievement,
  };
};

export default useNotifications;
