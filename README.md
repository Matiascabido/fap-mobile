# FAP Mobile

Aplicación móvil (iOS y Android) de **FAP — Funcional Atlético Personalizado**, sistema de gestión de gimnasio. Construida con React Native + Expo, replicando la funcionalidad y diseño de la aplicación web.

## Stack tecnológico

- **Framework:** React Native + Expo SDK 56
- **Lenguaje:** TypeScript (modo estricto)
- **Navegación:** React Navigation v7 (Drawer + Stacks)
- **Estilos:** NativeWind v4 (Tailwind CSS) + StyleSheet, con dark mode
- **HTTP:** Axios con interceptores (token JWT + manejo de 401)
- **Almacenamiento:** AsyncStorage
- **Formularios/validación:** React Hook Form + Zod
- **Gráficos:** react-native-chart-kit + react-native-svg
- **Fechas:** date-fns (locale es)
- **Íconos:** @expo/vector-icons (MaterialCommunityIcons)

## Estructura del proyecto

```
src/
├── components/
│   ├── common/        # Button, Card, Input, Avatar, Badge, Loader, EmptyState,
│   │                  # EvolutionChart, KpiCard, SocioSelector, ErrorBoundary
│   └── navigation/    # Header, DrawerContent
├── constants/         # colors, config, navigation
├── context/           # AuthContext, ThemeContext
├── hooks/             # useAuth, usePermissions, useDarkMode, useDebounce
├── navigation/        # AppNavigator, AuthNavigator, MainNavigator, types
├── screens/           # auth, home, socios, planes, suscripciones, turnero,
│                      # evaluaciones, metricas, tutoriales, perfil
├── services/api/      # http, storage, login, socios, planes, turnero,
│                      # suscripciones, evaluaciones, metricas, tutoriales
├── types/             # tipos por dominio
└── utils/             # formatters, validators
```

## Configuración

La URL del backend se define en `.env`:

```
API_URL=https://fap-backend-q75z.onrender.com
```

## Comandos

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar el servidor de desarrollo
npm start

# Plataformas específicas
npm run android
npm run ios

# Verificar tipos
node node_modules/typescript/lib/tsc.js --noEmit
```

## Módulos implementados

| Módulo | Descripción |
|--------|-------------|
| **Login** | Autenticación JWT, "recordarme", validación |
| **Inicio** | Saludo personalizado y accesos rápidos según permisos |
| **Socios** | Listado con búsqueda/filtros, detalle completo (datos, domicilio, historia clínica) |
| **Planes** | Listado y detalle con bloques y ejercicios por día |
| **Turnero** | Calendario semanal, inscripción/desinscripción a clases |
| **Suscripciones** | Filtros por estado, alertas de vencimiento |
| **Evaluaciones** | Selector de socio, historial y gráficos de evolución |
| **Métricas** | Dashboard adaptativo según rol (GOD / Profesional / Socio) con KPIs y charts |
| **Tutoriales** | Feed de videos con filtros por grupo y reproducción |
| **Perfil** | Datos de cuenta, selector de tema, permisos, logout |

## Control de acceso

La app usa permisos basados en roles (RBAC) provenientes del JWT (`modulo:accion` con scopes `all` / `related` / `own`). El menú lateral y los accesos rápidos se filtran automáticamente según los permisos del usuario.

## Publicación (EAS)

La configuración de builds está en `eas.json` (perfiles `development`, `preview`, `production`).

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login y configuración del proyecto
eas login
eas build:configure

# Builds
eas build --platform android --profile preview     # APK para pruebas
eas build --platform all --profile production       # Builds para tiendas

# Envío a tiendas
eas submit --platform ios
eas submit --platform android
```

Antes de publicar completá en `app.json` el `extra.eas.projectId` (generado por `eas build:configure`) y las credenciales de tienda en `eas.json` (`submit.production`).

## Preparado para AdMob

La arquitectura está lista para integrar `react-native-google-mobile-ads` a futuro sin cambios estructurales.
