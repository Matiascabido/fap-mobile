import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { buildQuickAccesses, QuickAccess } from '../utils/quickAccesses';
import { getUserId } from '../utils/userId';
import {
  buildDefaultNavigationPreferences,
  clearNavigationPreferences,
  loadNavigationPreferences,
  normalizeNavigationPreferences,
  resolveMoreRoutes,
  resolveNavigationItems,
  saveNavigationPreferences,
} from '../utils/navigationPreferences';
import {
  MAX_TAB_SLOTS,
  NavigationPreferences,
} from '../types/navigationPreferences.types';

interface NavigationPreferencesContextValue {
  loading: boolean;
  available: QuickAccess[];
  prefs: NavigationPreferences;
  tabRoutes: string[];
  homeItems: QuickAccess[];
  moreItems: QuickAccess[];
  toggleTabRoute: (route: string) => Promise<void>;
  toggleHomePin: (route: string) => Promise<void>;
  toggleMoreRoute: (route: string) => Promise<void>;
  isTabRoute: (route: string) => boolean;
  isHomePinned: (route: string) => boolean;
  isMoreRoute: (route: string) => boolean;
  canAddTabRoute: boolean;
  restoreDefaults: () => Promise<void>;
}

const NavigationPreferencesContext = createContext<
  NavigationPreferencesContextValue | undefined
>(undefined);

export function NavigationPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  const permissions = usePermissions();

  const available = useMemo(
    () =>
      buildQuickAccesses({
        isSocioSolo: permissions.isSocioSinPlan(),
        isProfesional: permissions.isProfesionalUser,
        isAdmin: permissions.isGodOrAdmin(),
        canManageTurnos: permissions.canManageTurnos(),
        canEnrollTurnos: permissions.canEnrollTurnos(),
        canManageEvaluaciones: permissions.canManageEvaluaciones(),
        canViewPlanEntrenamiento: permissions.canViewPlanEntrenamiento(),
        hasPermission: permissions.hasPermission,
      }),
    [user]
  );

  const [prefs, setPrefs] = useState<NavigationPreferences>(
    buildDefaultNavigationPreferences(available)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const loaded = await loadNavigationPreferences(userId, available);
      if (!cancelled) {
        setPrefs(loaded);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, available]);

  const persist = useCallback(
    async (next: NavigationPreferences) => {
      const normalized = normalizeNavigationPreferences(next, available);
      setPrefs(normalized);
      await saveNavigationPreferences(userId, normalized);
    },
    [available, userId]
  );

  const resolved = useMemo(
    () => resolveNavigationItems(available, prefs),
    [available, prefs]
  );

  const toggleTabRoute = useCallback(
    async (route: string) => {
      const current = prefs.tabRoutes;
      const isOn = current.includes(route);
      const nextTabs = isOn
        ? current.filter((r) => r !== route)
        : current.length >= MAX_TAB_SLOTS
          ? [...current.slice(1), route]
          : [...current, route];

      const nextPrefs: NavigationPreferences = {
        ...prefs,
        tabRoutes: nextTabs,
      };

      if (!isOn) {
        if (prefs.moreRoutes) {
          nextPrefs.moreRoutes = prefs.moreRoutes.filter((r) => r !== route);
          if (nextPrefs.moreRoutes.length === 0) nextPrefs.moreRoutes = null;
        }
      } else if (prefs.moreRoutes && !prefs.moreRoutes.includes(route)) {
        nextPrefs.moreRoutes = [...prefs.moreRoutes, route];
      }

      await persist(nextPrefs);
    },
    [persist, prefs]
  );

  const toggleHomePin = useCallback(
    async (route: string) => {
      const isOn = prefs.homePinnedRoutes.includes(route);
      const nextPinned = isOn
        ? prefs.homePinnedRoutes.filter((r) => r !== route)
        : [...prefs.homePinnedRoutes, route];

      await persist({ ...prefs, homePinnedRoutes: nextPinned });
    },
    [persist, prefs]
  );

  const toggleMoreRoute = useCallback(
    async (route: string) => {
      const currentMoreRoutes = resolveMoreRoutes(available, prefs);
      const isOn = currentMoreRoutes.includes(route);

      if (isOn) {
        const inTab = prefs.tabRoutes.includes(route);
        const inHome = prefs.homePinnedRoutes.includes(route);
        const moreOnlyCount = currentMoreRoutes.filter(
          (r) => !prefs.tabRoutes.includes(r) && !prefs.homePinnedRoutes.includes(r)
        ).length;
        if (!inTab && !inHome && moreOnlyCount <= 1) return;
      }

      const explicitBase = prefs.moreRoutes ?? currentMoreRoutes;
      const nextMore = isOn
        ? explicitBase.filter((r) => r !== route)
        : [...explicitBase, route];

      await persist({
        ...prefs,
        moreRoutes: nextMore.length > 0 ? nextMore : null,
      });
    },
    [available, persist, prefs]
  );

  const restoreDefaults = useCallback(async () => {
    await clearNavigationPreferences(userId);
    const defaults = buildDefaultNavigationPreferences(available);
    setPrefs(defaults);
  }, [available, userId]);

  const isTabRoute = useCallback(
    (route: string) => prefs.tabRoutes.includes(route),
    [prefs.tabRoutes]
  );

  const isHomePinned = useCallback(
    (route: string) => prefs.homePinnedRoutes.includes(route),
    [prefs.homePinnedRoutes]
  );

  const isMoreRoute = useCallback(
    (route: string) => resolved.moreItems.some((item) => item.route === route),
    [resolved.moreItems]
  );

  const value: NavigationPreferencesContextValue = {
    loading,
    available,
    prefs,
    tabRoutes: resolved.tabRoutes,
    homeItems: resolved.homeItems,
    moreItems: resolved.moreItems,
    toggleTabRoute,
    toggleHomePin,
    toggleMoreRoute,
    isTabRoute,
    isHomePinned,
    isMoreRoute,
    canAddTabRoute: prefs.tabRoutes.length < MAX_TAB_SLOTS,
    restoreDefaults,
  };

  return (
    <NavigationPreferencesContext.Provider value={value}>
      {children}
    </NavigationPreferencesContext.Provider>
  );
}

export function useNavigationPreferences() {
  const ctx = useContext(NavigationPreferencesContext);
  if (!ctx) {
    throw new Error('useNavigationPreferences must be used within NavigationPreferencesProvider');
  }
  return ctx;
}
