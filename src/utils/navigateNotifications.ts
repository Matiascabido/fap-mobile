import { CommonActions } from '@react-navigation/native';
import { hapticSelection } from './haptics';

type NavLike = {
  navigate: (...args: unknown[]) => void;
  dispatch: (action: ReturnType<typeof CommonActions.navigate>) => void;
  getState?: () => { routeNames?: string[] };
  getParent?: () => NavLike | undefined;
};

/** Abre la bandeja de notificaciones desde cualquier stack/tab anidado. */
export function navigateToNotifications(navigation: NavLike): void {
  hapticSelection();

  const state = navigation.getState?.();
  if (state?.routeNames?.includes('Notifications')) {
    navigation.navigate('Notifications');
    return;
  }

  let cursor: NavLike | undefined = navigation;
  while (cursor) {
    const routeNames = cursor.getState?.()?.routeNames ?? [];
    if (routeNames.includes('More')) {
      cursor.dispatch(
        CommonActions.navigate({
          name: 'More',
          params: { screen: 'Notifications' },
        })
      );
      return;
    }
    cursor = cursor.getParent?.();
  }

  navigation.dispatch(
    CommonActions.navigate({
      name: 'More',
      params: { screen: 'Notifications' },
    })
  );
}
