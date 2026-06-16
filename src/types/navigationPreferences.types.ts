export interface NavigationPreferences {
  tabRoutes: string[];
  homePinnedRoutes: string[];
  /** null = todas las disponibles que no están en la barra inferior */
  moreRoutes: string[] | null;
}

export const MAX_TAB_SLOTS = 2;

export const DEFAULT_NAVIGATION_PREFERENCES: NavigationPreferences = {
  tabRoutes: [],
  homePinnedRoutes: [],
  moreRoutes: null,
};
