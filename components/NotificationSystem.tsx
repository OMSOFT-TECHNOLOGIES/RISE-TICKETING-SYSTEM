import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Bell,
  AlertCircle
} from 'lucide-react';

// Types for notifications and alerts
interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissible: boolean;
  persistent: boolean;
}

interface NotificationContextType {
  alerts: SystemAlert[];
  addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, description?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Mock system alerts for demonstration
const mockSystemAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'System Maintenance Scheduled',
    message: 'RISE system will undergo maintenance on Sunday, 2:00 AM - 4:00 AM GMT. Some features may be unavailable.',
    timestamp: new Date(),
    dismissible: true,
    persistent: true
  },
  {
    id: '2',
    type: 'info',
    title: 'New Feature Available',
    message: 'Real-time GPS tracking for vehicles is now available in the vehicle management section.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    dismissible: true,
    persistent: false
  }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockSystemAlerts);

  const addAlert = (alertData: Omit<SystemAlert, 'id' | 'timestamp'>) => {
    const newAlert: SystemAlert = {
      ...alertData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, description?: string) => {
    try {
      const toastConfig = {
        description,
        duration: type === 'error' ? 6000 : 4000,
      };

      switch (type) {
        case 'success':
          toast.success(message, toastConfig);
          break;
        case 'error':
          toast.error(message, toastConfig);
          break;
        case 'warning':
          toast.warning(message, toastConfig);
          break;
        case 'info':
        default:
          toast.info(message, toastConfig);
          break;
      }
    } catch (error) {
      console.warn('Toast notification failed:', error);
      // Fallback to simple alert if toast fails
      alert(`${type.toUpperCase()}: ${message}`);
    }
  };

  // Auto-remove non-persistent alerts after 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setAlerts(prev => 
        prev.filter(alert => {
          if (alert.persistent) return true;
          const hoursSinceCreated = (now.getTime() - alert.timestamp.getTime()) / (1000 * 60 * 60);
          return hoursSinceCreated < 24;
        })
      );
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ alerts, addAlert, removeAlert, showToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

// System-wide alert banner component
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
        return 'default'; // Will be styled as warning
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
            alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
            alert.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
            alert.type === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
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

// Demo notification triggers (for testing)
export function NotificationDemo() {
  const { showToast, addAlert } = useNotifications();

  const triggerToast = (type: 'success' | 'error' | 'info' | 'warning') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred while processing your request.',
      info: 'Here is some important information for you.',
      warning: 'Please be aware of this potential issue.'
    };
    
    showToast(type, messages[type], 'This is a demo notification.');
  };

  const triggerAlert = () => {
    addAlert({
      type: 'info',
      title: 'Demo Alert',
      message: 'This is a demo system alert that appears at the top of the page.',
      dismissible: true,
      persistent: false
    });
  };

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <h3 className="font-medium">Notification Demo</h3>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => triggerToast('success')}>
          Success Toast
        </Button>
        <Button size="sm" onClick={() => triggerToast('error')} variant="destructive">
          Error Toast
        </Button>
        <Button size="sm" onClick={() => triggerToast('warning')} variant="outline">
          Warning Toast
        </Button>
        <Button size="sm" onClick={() => triggerToast('info')} variant="secondary">
          Info Toast
        </Button>
        <Button size="sm" onClick={triggerAlert} variant="outline">
          System Alert
        </Button>
      </div>
    </div>
  );
}