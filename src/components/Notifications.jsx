import { X, CheckCircle, AlertCircle, Info, Trophy } from "lucide-react";
import { useNotifications } from "../stores";

const Notifications = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "achievement":
        return <Trophy className="h-5 w-5 text-gold-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "achievement":
        return "bg-gold-50 border-gold-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-start p-4 border rounded-lg shadow-lg
            transform transition-all duration-300 ease-in-out
            ${getStyles(notification.type)}
          `}
        >
          <div className="flex-shrink-0">{getIcon(notification.type)}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.message}
            </p>
            {notification.description && (
              <p className="mt-1 text-sm text-gray-500">
                {notification.description}
              </p>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
