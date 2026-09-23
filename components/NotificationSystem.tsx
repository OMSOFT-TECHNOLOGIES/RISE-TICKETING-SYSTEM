import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { notify } from './utils/notify';
import { notificationApi, getAuthToken } from './utils/api';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  AlertCircle,
} from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissible: boolean;
  persistent: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'maintenance' | 'complaint' | 'payment' | 'system' | 'info';
  timestamp: Date;
}

interface NotificationContextType {
  alerts: SystemAlert[];
  notifications: AppNotification[];
  unreadCount: number;
  addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'time' | 'read' | 'timestamp'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  showToast: (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    description?: string
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DISMISSED_ALERTS_KEY = 'rise-dismissed-alerts';

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function mapNotification(item: Record<string, unknown>): AppNotification {
  const timestamp = new Date(String(item.timestamp ?? item.createdAt ?? Date.now()));
  const type = String(item.type ?? 'info') as AppNotification['type'];

  return {
    id: String(item.id ?? Date.now()),
    title: String(item.title ?? 'Notification'),
    message: String(item.message ?? item.body ?? ''),
    type: ['booking', 'maintenance', 'complaint', 'payment', 'system', 'info'].includes(type)
      ? type
      : 'info',
    read: Boolean(item.read ?? item.isRead ?? false),
    timestamp,
    time: formatRelativeTime(timestamp),
  };
}

function mapAlert(item: Record<string, unknown>): SystemAlert {
  const type = String(item.type ?? 'info') as SystemAlert['type'];

  return {
    id: String(item.id ?? Date.now()),
    type: ['info', 'warning', 'error', 'success'].includes(type) ? type : 'info',
    title: String(item.title ?? 'System Alert'),
    message: String(item.message ?? item.body ?? ''),
    timestamp: new Date(String(item.timestamp ?? item.createdAt ?? Date.now())),
    dismissible: item.dismissible !== false,
    persistent: Boolean(item.persistent ?? false),
  };
}

function loadDismissedAlertIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const fetchNotificationsAndAlerts = useCallback(async () => {
    if (!getAuthToken()) return;

    try {
      const [notificationsRes, alertsRes] = await Promise.all([
        notificationApi.getAll({ limit: 50 }),
        notificationApi.getAlerts(),
      ]);

      if (notificationsRes.success && notificationsRes.data) {
        const items = Array.isArray(notificationsRes.data)
          ? notificationsRes.data
          : (notificationsRes.data as { notifications?: unknown[] }).notifications ?? [];
        setNotifications((items as Record<string, unknown>[]).map(mapNotification));
      }

      if (alertsRes.success && alertsRes.data) {
        const dismissed = loadDismissedAlertIds();
        const items = Array.isArray(alertsRes.data)
          ? alertsRes.data
          : (alertsRes.data as { alerts?: unknown[] }).alerts ?? [];
        setAlerts(
          (items as Record<string, unknown>[])
            .map(mapAlert)
            .filter((alert) => !dismissed.includes(alert.id))
        );
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    void fetchNotificationsAndAlerts();
  }, [fetchNotificationsAndAlerts]);

  const addAlert = useCallback((alertData: Omit<SystemAlert, 'id' | 'timestamp'>) => {
    const newAlert: SystemAlert = {
      ...alertData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));

    try {
      const dismissed = loadDismissedAlertIds();
      if (!dismissed.includes(id)) {
        localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...dismissed, id]));
      }
      await notificationApi.dismissAlert(id);
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }, []);

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'time' | 'read' | 'timestamp'>) => {
      const timestamp = new Date();
      const newNotification: AppNotification = {
        ...notification,
        id: Date.now().toString(),
        timestamp,
        time: formatRelativeTime(timestamp),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    try {
      await notificationApi.markRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));

    try {
      await notificationApi.markAllRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const showToast = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'warning',
      message: string,
      description?: string
    ) => {
      const options = description ? { description } : undefined;

      switch (type) {
        case 'success':
          notify.success(message, options);
          break;
        case 'error':
          notify.error(message, options);
          break;
        case 'warning':
          notify.warning(message, options);
          break;
        case 'info':
        default:
          notify.info(message, options);
          break;
      }
    },
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setAlerts((prev) =>
        prev.filter((alert) => {
          if (alert.persistent) return true;
          const hoursSinceCreated =
            (now.getTime() - alert.timestamp.getTime()) / (1000 * 60 * 60);
          return hoursSinceCreated < 24;
        })
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          time: formatRelativeTime(notification.timestamp),
        }))
      );
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        alerts,
        notifications,
        unreadCount,
        addAlert,
        removeAlert,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        showToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function SystemAlerts() {
  const { alerts, removeAlert } = useNotifications();

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'info':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
      case 'success':
      case 'info':
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 p-4 bg-background border-b">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          variant={getAlertVariant(alert.type)}
          className={`${
            alert.type === 'warning'
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
              : alert.type === 'success'
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : alert.type === 'info'
                  ? 'border-[#193cb8] bg-blue-50 dark:bg-blue-950'
                  : ''
          }`}
        >
          {getAlertIcon(alert.type)}
          <div className="flex-1">
            <AlertTitle className="flex items-center justify-between">
              <span>{alert.title}</span>
              {alert.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAlert(alert.id)}
                  className="h-auto p-1 hover:bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            <p className="text-xs text-muted-foreground mt-1">
              {alert.timestamp.toLocaleString()}
            </p>
          </div>
        </Alert>
      ))}
    </div>
  );
}
