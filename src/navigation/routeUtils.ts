import type { NavigationState, PartialState } from '@react-navigation/native';

type NavState = NavigationState | PartialState<NavigationState>;

/** Obtiene el nombre de la ruta hoja activa (drawer → stack → pantalla). */
export function getActiveRouteName(state: NavState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index ?? 0];
  if (!route) return undefined;
  if (route.state) return getActiveRouteName(route.state as NavState);
  return route.name;
}
