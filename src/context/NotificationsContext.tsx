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
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { turneroService } from '../services/api/turnero.service';
import { suscripcionesService } from '../services/api/suscripciones.service';
import { pagosCobranzasService } from '../services/api/pagosCobranzas.service';
import { getUserId } from '../utils/userId';
import {
  puedeInscribirseATurnos,
  esRolEntrenado,
  esRolSocioClub,
  esRolEntrnadoOff,
} from '../utils/sessionRole';
import {
  hydrateTurnoInscripciones,
  syncTurnoInscripcionesFromList,
} from '../utils/turnoInscripcion';
import { evaluateNotifications } from '../utils/notifications/notificationEngine';
import {
  dismissNotificationKey,
  loadDismissedKeys,
} from '../utils/notifications/notificationDismissals';
import { loadNotificationSettings } from '../utils/notifications/notificationSettings';
import {
  createDemoNotifications,
  ENABLE_NOTIFICATION_DEMOS,
  isDemoNotificationId,
} from '../utils/notifications/demoNotifications';
import type { AppNotification } from '../types/notifications.types';

const REFRESH_INTERVAL_MS = 60_000;
const GYM_UTC_OFFSET = '-03:00';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isRefreshing: boolean;
  refreshNotifications: (force?: boolean) => Promise<AppNotification[]>;
  dismissNotification: (id: string) => Promise<void>;
  resetDemoNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

function todayTomorrowRange(): { desde: string; hasta: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    desde: `${format(today, 'yyyy-MM-dd')}T00:00:00${GYM_UTC_OFFSET}`,
    hasta: `${format(tomorrow, 'yyyy-MM-dd')}T23:59:59${GYM_UTC_OFFSET}`,
  };
}

function shouldIncludeSuscripciones(user: ReturnType<typeof useAuth>['user']): boolean {
  if (!user) return false;
  return esRolEntrenado(user) || esRolSocioClub(user) || esRolEntrnadoOff(user);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  const userEmail = user?.mail;

  const [realNotifications, setRealNotifications] = useState<AppNotification[]>([]);
  const [demoDismissed, setDemoDismissed] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshRef = useRef(0);
  const refreshingRef = useRef(false);

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
      if (!force && now - lastRefreshRef.current < 5_000) {
        return [...demos, ...realNotifications];
      }
      if (refreshingRef.current) {
        return [...demos, ...realNotifications];
      }

      refreshingRef.current = true;
      setIsRefreshing(true);

      try {
        const range = todayTomorrowRange();
        const canEnroll = puedeInscribirseATurnos(user);
        const includeSubs = shouldIncludeSuscripciones(user);

        await hydrateTurnoInscripciones(userId);

        const turnosPromise = canEnroll
          ? turneroService
              .list({
                desde: range.desde,
                hasta: range.hasta,
                email_socio: userEmail,
              })
              .then(async (data) => {
                await syncTurnoInscripcionesFromList(data, userId, userEmail);
                return data;
              })
              .catch(() => [] as Awaited<ReturnType<typeof turneroService.list>>)
          : Promise.resolve([] as Awaited<ReturnType<typeof turneroService.list>>);

        const suscripcionesPromise = includeSubs
          ? suscripcionesService.getByUsuario(userId).catch(() => [])
          : Promise.resolve([]);

        const pagosPromise = includeSubs
          ? pagosCobranzasService.getAll({ id_usuario_socio: userId, limit: 100 }).catch(() => [])
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
          canEnrollTurnos: canEnroll,
          includeSuscripciones: includeSubs,
        });

        setRealNotifications(next);
        lastRefreshRef.current = Date.now();
        return [...demoNotificationsRef.current, ...next];
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
      }
    },
    [user, userId, userEmail, realNotifications]
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

  useEffect(() => {
    if (!userId) {
      setRealNotifications([]);
      setDemoDismissed(new Set());
      return;
    }
    void refreshNotifications(true);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      unreadCount: notifications.length,
      isRefreshing,
      refreshNotifications,
      dismissNotification,
      resetDemoNotifications,
    }),
    [notifications, isRefreshing, refreshNotifications, dismissNotification, resetDemoNotifications]
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
