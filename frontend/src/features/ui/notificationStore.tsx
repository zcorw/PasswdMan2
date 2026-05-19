import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

export type NotificationSeverity = 'error' | 'info' | 'success' | 'warning';

export interface AppNotification {
  id: number;
  message: string;
  severity: NotificationSeverity;
}

interface NotificationState {
  current: AppNotification | null;
  nextId: number;
}

type NotificationAction =
  | { type: 'clear' }
  | { message: string; severity?: NotificationSeverity; type: 'notify' };

interface NotificationContextValue {
  clearNotification: () => void;
  current: AppNotification | null;
  notify: (message: string, severity?: NotificationSeverity) => void;
}

const initialNotificationState: NotificationState = {
  current: null,
  nextId: 1,
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'clear':
      return { ...state, current: null };
    case 'notify':
      return {
        current: {
          id: state.nextId,
          message: action.message,
          severity: action.severity ?? 'info',
        },
        nextId: state.nextId + 1,
      };
    default:
      return state;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialNotificationState);

  const clearNotification = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  const notify = useCallback((message: string, severity: NotificationSeverity = 'info') => {
    dispatch({ message, severity, type: 'notify' });
  }, []);

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      clearNotification,
      current: state.current,
      notify,
    }),
    [clearNotification, notify, state.current],
  );

  return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

