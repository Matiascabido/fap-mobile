/** Navega a un módulo desde tabs, stacks anidados o el hub «Más». */
import {
  isMainTabModuleRoute,
  TAB_MODULE_INITIAL_SCREEN,
} from '../constants/navigationModules';

const FIXED_TAB_ROUTES = new Set(['Home', 'More']);

export function navigateToModule(navigation: any, route: string) {
  if (route === 'Home') {
    navigation.navigate('Home', { screen: 'HomeMain' });
    return;
  }

  if (isMainTabModuleRoute(route)) {
    const initialScreen = TAB_MODULE_INITIAL_SCREEN[route];
    const state = navigation.getState?.();
    const tabNames = state?.routeNames ?? state?.routes?.map((r: { name: string }) => r.name) ?? [];

    if (tabNames.includes(route)) {
      navigation.navigate(route, { screen: initialScreen });
      return;
    }

    navigation.navigate('More', { screen: route });
    return;
  }

  if (!FIXED_TAB_ROUTES.has(route)) {
    navigation.navigate('More', { screen: route });
  }
}
