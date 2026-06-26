import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getUserId } from '../utils/userId';
import {
  puedeRecibirAlertasSuscripciones,
  puedeRecibirAlertasTurnos,
  getTurnoAlertMode,
  loadTurnosForNotifications,
  loadSuscripcionesForNotifications,
  loadPagosForNotifications,
} from '../utils/notifications/notificationData';
import {
  hydrateTurnoInscripciones,
  syncTurnoInscripcionesFromList,
} from '../utils/turnoInscripcion';
import { evaluateNotifications } from '../utils/notifications/notificationEngine';
import { calcularEstadoSuscripcion } from '../services/api/suscripciones.service';
import {
  dismissNotificationKey,
  loadDismissedKeys,
  clearDismissedKeys,
} from '../utils/notifications/notificationDismissals';
import { loadNotificationSettings } from '../utils/notifications/notificationSettings';
import {
  createDemoNotifications,
  ENABLE_NOTIFICATION_DEMOS,
  isDemoNotificationId,
} from '../utils/notifications/demoNotifications';
import type { AppNotification } from '../types/notifications.types';

const REFRESH_INTERVAL_MS = 60_000;
const MIN_REFRESH_GAP_MS = 5_000;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isRefreshing: boolean;
  refreshNotifications: (force?: boolean) => Promise<AppNotification[]>;
  dismissNotification: (id: string) => Promise<void>;
  resetDemoNotifications: () => void;
  restoreDismissedAlerts: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  const userEmail = user?.mail;

  const [realNotifications, setRealNotifications] = useState<AppNotification[]>([]);
  const [demoDismissed, setDemoDismissed] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshRef = useRef(0);
  const refreshingRef = useRef(false);
  const realNotificationsRef = useRef(realNotifications);
  realNotificationsRef.current = realNotifications;

  const demoNotifications = useMemo(() => {
    if (!ENABLE_NOTIFICATION_DEMOS || !userId) return [];
    return createDemoNotifications().filter((d) => !demoDismissed.has(d.id));
  }, [userId, demoDismissed]);

  const demoNotificationsRef = useRef(demoNotifications);
  demoNotificationsRef.current = demoNotifications;

  const notifications = useMemo(
    () => [...demoNotifications, ...realNotifications],
    [demoNotifications, realNotifications]
  );

  const refreshNotifications = useCallback(
    async (force = false): Promise<AppNotification[]> => {
      const demos = demoNotificationsRef.current;

      if (!userId || !user) {
        setRealNotifications([]);
        return demos;
      }

      const now = Date.now();
      if (!force && now - lastRefreshRef.current < MIN_REFRESH_GAP_MS) {
        return [...demos, ...realNotificationsRef.current];
      }
      if (refreshingRef.current) {
        return [...demos, ...realNotificationsRef.current];
      }

      refreshingRef.current = true;
      setIsRefreshing(true);

      try {
        const turnoAlertMode = getTurnoAlertMode(user);
        const includeSubs = puedeRecibirAlertasSuscripciones(user);
        const includeTurnos = puedeRecibirAlertasTurnos(user);

        await hydrateTurnoInscripciones(userId);

        const turnosPromise = includeTurnos
          ? loadTurnosForNotifications(user, userEmail).then(async (data) => {
              if (turnoAlertMode === 'inscripto') {
                await syncTurnoInscripcionesFromList(data, userId, userEmail);
              }
              return data;
            })
          : Promise.resolve([] as Awaited<ReturnType<typeof loadTurnosForNotifications>>);

        const suscripcionesPromise = includeSubs
          ? loadSuscripcionesForNotifications(user, userId)
          : Promise.resolve([]);

        const pagosPromise = includeSubs
          ? loadPagosForNotifications(user, userId)
          : Promise.resolve([]);

        const [turnos, suscripciones, pagos, dismissedKeys, settings] = await Promise.all([
          turnosPromise,
          suscripcionesPromise,
          pagosPromise,
          loadDismissedKeys(userId),
          loadNotificationSettings(),
        ]);

        const next = evaluateNotifications({
          turnos,
          suscripciones,
          pagos,
          userId,
          userEmail,
          settings,
          dismissedKeys,
          turnoAlertMode,
          includeSuscripciones: includeSubs,
        });

        if (__DEV__) {
          const alertables = suscripciones.filter(
            (s) => calcularEstadoSuscripcion(s) !== 'vigente'
          ).length;
          console.log(
            `[Notificaciones] suscripciones=${suscripciones.length} alertables=${alertables} generadas=${next.length} descartadas=${dismissedKeys.size}`
          );
        }

        setRealNotifications(next);
        lastRefreshRef.current = Date.now();
        return [...demoNotificationsRef.current, ...next];
      } catch (error) {
        console.error('Error refreshing notifications:', error);
        return [...demos, ...realNotificationsRef.current];
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
      }
    },
    [user, userId, userEmail]
  );

  const dismissNotification = useCallback(
    async (id: string) => {
      if (isDemoNotificationId(id)) {
        setDemoDismissed((prev) => new Set(prev).add(id));
        return;
      }
      if (!userId) return;
      await dismissNotificationKey(userId, id);
      setRealNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [userId]
  );

  const resetDemoNotifications = useCallback(() => {
    setDemoDismissed(new Set());
  }, []);

  const restoreDismissedAlerts = useCallback(async () => {
    if (!userId) return;
    await clearDismissedKeys(userId);
    await refreshNotifications(true);
  }, [userId, refreshNotifications]);

  useEffect(() => {
    if (!userId) {
      setRealNotifications([]);
      setDemoDismissed(new Set());
      return;
    }
    void refreshNotifications(true);
  }, [userId, refreshNotifications]);

  useEffect(() => {
    if (!userId) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (interval) return;
      interval = setInterval(() => {
        void refreshNotifications(true);
      }, REFRESH_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void refreshNotifications(true);
        startInterval();
      } else {
        stopInterval();
      }
    };

    if (AppState.currentState === 'active') {
      startInterval();
    }

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      stopInterval();
      sub.remove();
    };
  }, [userId, refreshNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.isDemo).length,
      isRefreshing,
      refreshNotifications,
      dismissNotification,
      resetDemoNotifications,
      restoreDismissedAlerts,
    }),
    [notifications, isRefreshing, refreshNotifications, dismissNotification, resetDemoNotifications, restoreDismissedAlerts]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider');
  }
  return ctx;
}
