/** Navega a un módulo desde tabs, stacks anidados o el hub «Más». */
export function navigateToModule(navigation: any, route: string) {
  const tabRoutes = new Set(['Home', 'Planes', 'Tutoriales']);
  if (tabRoutes.has(route)) {
    if (route === 'Home') {
      navigation.navigate('Home', { screen: 'HomeMain' });
      return;
    }
    navigation.navigate(route, {
      screen: route === 'Planes' ? 'PlanesList' : 'TutorialesMain',
    });
    return;
  }
  navigation.navigate('More', { screen: route });
}
