import { storage, STORAGE_KEYS } from '../services/api/storage';
import { QuickAccess } from './quickAccesses';
import {
  DEFAULT_NAVIGATION_PREFERENCES,
  MAX_TAB_SLOTS,
  NavigationPreferences,
} from '../types/navigationPreferences.types';

function prefsKey(userId: string): string {
  return `${STORAGE_KEYS.NAVIGATION_PREFERENCES}:${userId}`;
}

function legacyMoreKey(userId: string): string {
  return `${STORAGE_KEYS.QUICK_ACCESS_ROUTES}:${userId}`;
}

function sanitizeRoutes(routes: string[], allowed: Set<string>): string[] {
  const seen = new Set<string>();
  return routes.filter((route) => {
    if (!allowed.has(route) || seen.has(route)) return false;
    seen.add(route);
    return true;
  });
}

export function getDefaultTabRoutes(available: QuickAccess[]): string[] {
  const preferred = ['Planes', 'Tutoriales'];
  return preferred
    .filter((route) => available.some((item) => item.route === route))
    .slice(0, MAX_TAB_SLOTS);
}

export function normalizeNavigationPreferences(
  prefs: NavigationPreferences,
  available: QuickAccess[]
): NavigationPreferences {
  const allowed = new Set(available.map((item) => item.route));
  const tabRoutes = sanitizeRoutes(prefs.tabRoutes, allowed).slice(0, MAX_TAB_SLOTS);
  const homePinnedRoutes = sanitizeRoutes(prefs.homePinnedRoutes, allowed);
  const moreRoutesRaw = prefs.moreRoutes
    ? sanitizeRoutes(prefs.moreRoutes, allowed)
  : null;
  const moreRoutes =
    moreRoutesRaw && moreRoutesRaw.length > 0 ? moreRoutesRaw : null;

  return { tabRoutes, homePinnedRoutes, moreRoutes };
}

export function buildDefaultNavigationPreferences(available: QuickAccess[]): NavigationPreferences {
  return normalizeNavigationPreferences(
    {
      tabRoutes: getDefaultTabRoutes(available),
      homePinnedRoutes: [],
      moreRoutes: null,
    },
    available
  );
}

export async function loadNavigationPreferences(
  userId: string,
  available: QuickAccess[]
): Promise<NavigationPreferences> {
  if (!userId) return buildDefaultNavigationPreferences(available);

  const raw = await storage.get(prefsKey(userId));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<NavigationPreferences>;
      return normalizeNavigationPreferences(
        {
          tabRoutes: Array.isArray(parsed.tabRoutes) ? parsed.tabRoutes : [],
          homePinnedRoutes: Array.isArray(parsed.homePinnedRoutes)
            ? parsed.homePinnedRoutes
            : [],
          moreRoutes: Array.isArray(parsed.moreRoutes) ? parsed.moreRoutes : null,
        },
        available
      );
    } catch {
      // fall through to legacy / defaults
    }
  }

  const legacyRaw = await storage.get(legacyMoreKey(userId));
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      if (Array.isArray(legacy)) {
        const moreRoutes = legacy.filter((x): x is string => typeof x === 'string');
        return normalizeNavigationPreferences(
          {
            tabRoutes: getDefaultTabRoutes(available),
            homePinnedRoutes: [],
            moreRoutes: moreRoutes.length > 0 ? moreRoutes : null,
          },
          available
        );
      }
    } catch {
      // ignore
    }
  }

  return buildDefaultNavigationPreferences(available);
}

export async function saveNavigationPreferences(
  userId: string,
  prefs: NavigationPreferences
): Promise<void> {
  if (!userId) return;
  await storage.set(prefsKey(userId), JSON.stringify(prefs));
}

export async function clearNavigationPreferences(userId: string): Promise<void> {
  if (!userId) return;
  await Promise.all([
    storage.remove(prefsKey(userId)),
    storage.remove(legacyMoreKey(userId)),
  ]);
}

export function applyRouteOrder(all: QuickAccess[], routes: string[]): QuickAccess[] {
  const order = new Map(routes.map((route, index) => [route, index]));
  return all
    .filter((item) => order.has(item.route))
    .sort((a, b) => (order.get(a.route) ?? 0) - (order.get(b.route) ?? 0));
}

export function resolveMoreRoutes(
  available: QuickAccess[],
  prefs: NavigationPreferences
): string[] {
  if (prefs.moreRoutes) {
    return prefs.moreRoutes.filter((route) =>
      available.some((item) => item.route === route)
    );
  }
  const tabSet = new Set(prefs.tabRoutes);
  return available
    .map((item) => item.route)
    .filter((route) => !tabSet.has(route));
}

export function resolveNavigationItems(
  available: QuickAccess[],
  prefs: NavigationPreferences
) {
  const normalized = normalizeNavigationPreferences(prefs, available);
  const homeItems = applyRouteOrder(available, normalized.homePinnedRoutes);
  const moreRoutes = resolveMoreRoutes(available, normalized);
  const moreItems = applyRouteOrder(available, moreRoutes);

  return {
    prefs: normalized,
    tabRoutes: normalized.tabRoutes,
    homeItems,
    moreItems,
  };
}
