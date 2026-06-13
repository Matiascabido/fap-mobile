# PROMPT COMPLETO PARA IA - APLICACIÓN MÓVIL FAP

## Contexto del Proyecto

Sos un desarrollador senior especializado en React Native y Expo. Necesito que crees una aplicación móvil multiplataforma (iOS y Android) para un sistema de gestión de gimnasio/centro de entrenamiento llamado "FAP" (Funcional Atlético Personalizado).

## Proyecto Web Existente

La aplicación web actual está construida con:
- **Frontend**: Astro + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 con dark mode
- **Backend**: FastAPI (Python) en https://fap-backend-q75z.onrender.com
- **Autenticación**: JWT con Bearer tokens
- **API**: RESTful con ~26 servicios modulares

## Objetivo

Crear una aplicación móvil React Native + Expo que:
1. Replique la funcionalidad completa de la web
2. Mantenga el mismo diseño visual y branding
3. Sea publicable en App Store y Google Play
4. Tenga performance excepcional
5. Esté preparada para integrar publicidad (AdMob) en el futuro

---

# Arquitectura y Stack Tecnológico

## Stack Principal
```json
{
  "framework": "React Native",
  "runtime": "Expo SDK 52+",
  "language": "TypeScript (strict mode)",
  "navigation": "React Navigation v6 (Stack + Drawer + Bottom Tabs)",
  "styling": "NativeWind (Tailwind para React Native)",
  "state": "React hooks + Context API",
  "http": "Axios con interceptors",
  "storage": "@react-native-async-storage/async-storage",
  "forms": "React Hook Form + Zod",
  "charts": "react-native-chart-kit",
  "dates": "date-fns",
  "icons": "expo-icons (MaterialCommunityIcons)",
  "splash": "expo-splash-screen",
  "updates": "expo-updates (OTA)"
}
```

## Dependencias Clave
```bash
# Instalación inicial
npx create-expo-app fap-mobile --template blank-typescript

# Navegación
expo install react-navigation @react-navigation/native @react-navigation/stack @react-navigation/drawer @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated

# Styling
npm install nativewind tailwindcss@3.3.2
npm install --save-dev @types/react-native

# HTTP y Storage
npm install axios
expo install @react-native-async-storage/async-storage

# Forms
npm install react-hook-form zod @hookform/resolvers

# Charts
npm install react-native-chart-kit react-native-svg

# Dates
npm install date-fns

# Utils
npm install expo-constants expo-device expo-haptics
expo install expo-splash-screen expo-status-bar
```

---

# Diseño Visual y Branding

## Sistema de Colores (Tailwind Palette)

**Colores Principales**:
- **Primary (Rojo)**: `#DC2626` (red-600) - Botones principales, highlights
- **Primary Dark**: `#991B1B` (red-800) - Hover states
- **Secondary**: Gradiente `slate-900` (#0F172A) a `red-900` (#7F1D1D)

**Neutrales (Slate)**:
- Background Light: `#F8FAFC` (slate-50)
- Background Dark: `#0F172A` (slate-900)
- Cards Light: `#FFFFFF`
- Cards Dark: `#1E293B` (slate-800)
- Text Primary Light: `#1E293B` (slate-900)
- Text Primary Dark: `#F1F5F9` (slate-100)
- Text Secondary Light: `#64748B` (slate-500)
- Text Secondary Dark: `#94A3B8` (slate-400)
- Borders Light: `#E2E8F0` (slate-200)
- Borders Dark: `#334155` (slate-700)

**Estados**:
- Success: `#10B981` (green-500)
- Warning: `#F59E0B` (amber-500)
- Error: `#EF4444` (red-500)
- Info: `#3B82F6` (blue-500)

## Tipografía
- **Familia**: System fonts (SF Pro en iOS, Roboto en Android)
- **Títulos principales**: 28-32px, Bold (font-black)
- **Subtítulos**: 18-20px, SemiBold
- **Body**: 14-16px, Regular
- **Caption**: 12px, Medium

## Componentes de Diseño

### 1. Header/Navbar
- Altura: 64px
- Fondo: Blanco/Slate-900 con border-bottom sutil
- Logo: Imagen circular 40x40px (lado izquierdo)
- Título: Centrado, bold
- Avatar usuario: Círculo rojo con iniciales (lado derecho)
- Shadow: Sombra suave en modo light

### 2. Cards
- Border radius: 16-24px (redondeadas)
- Padding: 16-20px
- Shadow: `shadow-lg` en light mode
- Border: 1px slate-200/slate-700
- Hover/Press: Escala 0.98, bg más intenso

### 3. Botones
**Primario**:
```tsx
className="bg-red-600 rounded-2xl px-6 py-3 min-h-[48px] shadow-lg active:scale-98"
```

**Secundario**:
```tsx
className="border border-white/25 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur"
```

### 4. Inputs
- Border radius: 12px
- Border: 1px slate-200
- Focus: ring-2 ring-red-500
- Min height: 48px (touch target)
- Padding: 12px horizontal

### 5. Sidebar/Drawer
- Ancho: 280px
- Fondo: Blanco/Slate-800
- Items activos: bg-red-600 con shadow
- Items inactivos: hover bg-slate-100/white-5

---

# Estructura de Carpetas

```
fap-mobile/
├── app.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── App.tsx
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.tsx          # Root navigator
│   │   ├── AuthNavigator.tsx          # Login stack
│   │   ├── MainNavigator.tsx          # Authenticated drawer
│   │   └── types.ts                   # Navigation types
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── socios/
│   │   │   ├── SociosListScreen.tsx
│   │   │   └── SocioDetailScreen.tsx
│   │   ├── planes/
│   │   │   ├── PlanesListScreen.tsx
│   │   │   └── PlanDetailScreen.tsx
│   │   ├── suscripciones/
│   │   │   └── SuscripcionesScreen.tsx
│   │   ├── turnero/
│   │   │   └── TurneroScreen.tsx
│   │   ├── evaluaciones/
│   │   │   └── EvaluacionesScreen.tsx
│   │   ├── metricas/
│   │   │   └── MetricasScreen.tsx
│   │   ├── tutoriales/
│   │   │   └── TutorialesScreen.tsx
│   │   └── perfil/
│   │       └── PerfilScreen.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Icon.tsx
│   │   │   └── Toast.tsx
│   │   ├── navigation/
│   │   │   ├── DrawerContent.tsx
│   │   │   └── Header.tsx
│   │   └── [modulo]/
│   │       └── [ComponentesEspecíficos].tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── http.ts                # Axios instance + interceptors
│   │   │   ├── storage.ts             # AsyncStorage wrapper
│   │   │   ├── login.service.ts
│   │   │   ├── users.service.ts
│   │   │   ├── socios.service.ts
│   │   │   ├── planes.service.ts
│   │   │   ├── suscripciones.service.ts
│   │   │   ├── turnero.service.ts
│   │   │   ├── evaluaciones.service.ts
│   │   │   ├── metricas.service.ts
│   │   │   └── tutoriales.service.ts
│   │   └── notifications/
│   │       └── pushService.ts         # Expo Notifications
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   ├── socios.types.ts
│   │   ├── planes.types.ts
│   │   └── [resto de types del web]
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDarkMode.ts
│   │   ├── useApi.ts
│   │   └── usePermissions.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── sessionRole.ts
│   │   └── tokenScopes.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── navigation.ts
│   │   └── config.ts
│   └── assets/
│       ├── images/
│       │   ├── logo.png
│       │   ├── icon.png
│       │   └── splash.png
│       └── fonts/
└── .env                               # API_URL, etc.
```

---

# Módulos y Pantallas

## 1. **Autenticación**

### LoginScreen.tsx
**Funcionalidad**:
- Inputs: Usuario, Contraseña (con mostrar/ocultar)
- Checkbox "Recordarme"
- Botón "Ingresar" (loading state)
- Validación de campos vacíos
- Manejo de errores del backend
- Storage de token JWT
- Redirección a Home post-login

**Diseño**:
- Logo circular centrado (120x120px)
- Card blanca redondeada con shadow
- Gradiente de fondo (slate-50 a red-50)
- Loader animado durante login

**Código base**:
```tsx
// Campos: usuario, password, remember
// API: POST /login con { usuario, password }
// Response: { token, nombre, email, rol, scopes }
// Storage: AsyncStorage.setItem('auth_token', token)
```

---

## 2. **Home/Dashboard**

### HomeScreen.tsx
**Funcionalidad**:
- Saludo personalizado según hora del día
- Fecha actual en español
- Tarjeta hero con gradiente rojo-slate
- Accesos rápidos según rol del usuario:
  - **Profesional/Admin**: Métricas, Turnero
  - **Socio con plan**: Planes, Turnero
  - **Socio sin plan**: Tutoriales
- Sección "Accesos rápidos" con descripción

**Diseño**:
- Hero card: gradiente diagonal, texto blanco, sombra
- Botones primarios y secundarios
- Loader animado (pesas/mancuernas)
- Responsive con ScrollView

---

## 3. **Socios** (SociosListScreen + SocioDetailScreen)

### SociosListScreen.tsx
**Funcionalidad**:
- Lista paginada de socios
- Búsqueda por nombre/email
- Filtros: Estado (activo/inactivo), Grupo
- Botón FAB "Agregar Socio"
- Pull-to-refresh
- Card por socio: Nombre, Email, Teléfono, Estado

### SocioDetailScreen.tsx
**Funcionalidad**:
- Datos personales
- Domicilio
- Historia clínica
- Suscripciones activas
- Planes asignados
- Botones: Editar, Eliminar

**API**:
```typescript
GET /api/socios?page=1&limit=20&search=texto
GET /api/socios/{id}
POST /api/socios
PUT /api/socios/{id}
DELETE /api/socios/{id}
```

---

## 4. **Planes** (PlanesListScreen + PlanDetailScreen)

### PlanesListScreen.tsx
**Funcionalidad**:
- Lista de planes asignados al usuario (si es socio)
- Lista de todos los planes (si es profesional/admin)
- Filtro por estado: Activo, Finalizado
- Búsqueda por nombre de socio
- Card: Socio, Fecha inicio/fin, Progreso, Profesional asignado

### PlanDetailScreen.tsx
**Funcionalidad**:
- Información del plan
- Bloques de entrenamiento (día, ejercicios)
- Visualización de ejercicios: Serie, Reps, Peso, RPE
- Videos demostrativos de ejercicios
- Botón "Marcar como completado"
- Exportar a PDF

**API**:
```typescript
GET /api/planes?socio_id={id}
GET /api/planes/{id}
POST /api/planes/{id}/bloques
PUT /api/planes/{id}/ejercicios/{ej_id}
```

---

## 5. **Suscripciones**

### SuscripcionesScreen.tsx
**Funcionalidad**:
- Tabla de suscripciones activas
- Filtros: Estado, Fecha vencimiento
- Búsqueda por socio
- Alertas de vencimientos próximos
- Indicadores visuales: Activo (verde), Vencido (rojo), Próximo a vencer (amarillo)
- Botón agregar suscripción

**API**:
```typescript
GET /api/suscripciones?estado=activo
POST /api/suscripciones
PUT /api/suscripciones/{id}
```

---

## 6. **Turnero**

### TurneroScreen.tsx
**Funcionalidad**:
- Calendario semanal de turnos
- Vista por día
- Lista de clases disponibles: Horario, Cupos, Profesional
- Botón "Inscribirme" / "Cancelar inscripción"
- Estados: Disponible, Completo, Inscrito
- Push notification 30 min antes de clase

**API**:
```typescript
GET /api/turnos?fecha_inicio={YYYY-MM-DD}&fecha_fin={YYYY-MM-DD}
POST /api/turnos/{id}/inscribir
DELETE /api/turnos/{id}/desinscribir
```

---

## 7. **Evaluaciones**

### EvaluacionesScreen.tsx
**Funcionalidad**:
- Lista de evaluaciones de socios
- Filtros: Socio, Fecha
- Cards: Peso, IMC, % grasa, Medidas
- Gráficos de evolución temporal
- Botón "Nueva evaluación"

**API**:
```typescript
GET /api/evaluaciones?socio_id={id}
POST /api/evaluaciones
```

---

## 8. **Métricas**

### MetricasScreen.tsx
**Funcionalidad**:
- Dashboard personalizado según rol:
  - **Admin**: Economía, Retención, Morosidad, Turnos
  - **Profesional**: Planes activos, Clases dictadas, Socios asignados
  - **Socio**: Asistencias, Progreso personal
- Gráficos: Barras, Líneas, Torta
- Selector de período: Semana, Mes, Año
- Exportar a Excel

**Charts**:
```typescript
// Usar react-native-chart-kit
<LineChart
  data={data}
  width={Dimensions.get('window').width - 32}
  height={220}
  chartConfig={chartConfig}
/>
```

---

## 9. **Tutoriales**

### TutorialesScreen.tsx
**Funcionalidad**:
- Feed de videos estilo YouTube/TikTok
- Categorías: Técnica, Nutrición, Movilidad
- Búsqueda por título
- Reproducción en modal fullscreen
- Like/Favoritos
- Soporte para YouTube embeds

**API**:
```typescript
GET /api/tutoriales?categoria={cat}
GET /api/tutoriales/{id}
```

---

## 10. **Perfil**

### PerfilScreen.tsx
**Funcionalidad**:
- Avatar (con opción de cambiar foto)
- Datos: Nombre, Email, Teléfono, Rol
- Botón "Editar perfil"
- Toggle Dark Mode
- Botón "Cerrar sesión"
- Versión de la app

---

# Sistema de Navegación

## Estructura

```tsx
AuthContext (logged in?)
  ├─ NO → AuthNavigator (Stack)
  │       └─ LoginScreen
  └─ YES → MainNavigator (Drawer)
           ├─ HomeStack
           │   └─ HomeScreen
           ├─ SociosStack
           │   ├─ SociosListScreen
           │   └─ SocioDetailScreen
           ├─ PlanesStack
           ├─ SuscripcionesStack
           ├─ TurneroStack
           ├─ EvaluacionesStack
           ├─ MetricasStack
           ├─ TutorialesStack
           └─ PerfilStack
```

## Drawer (Sidebar)

**Header**:
- Avatar del usuario (círculo rojo, iniciales)
- Nombre y email
- Botón configuración (perfil)

**Items** (según permisos/scopes):
```tsx
const menuItems = [
  { name: 'Inicio', icon: 'home', route: 'Home', scope: null },
  { name: 'Socios', icon: 'account-group', route: 'Socios', scope: 'socios:read' },
  { name: 'Planes', icon: 'dumbbell', route: 'Planes', scope: 'planes:read' },
  { name: 'Suscripciones', icon: 'card-account-details', route: 'Suscripciones', scope: 'suscripciones:read' },
  { name: 'Turnero', icon: 'calendar-clock', route: 'Turnero', scope: 'turnero:read' },
  { name: 'Evaluaciones', icon: 'clipboard-text', route: 'Evaluaciones', scope: 'evaluaciones:read' },
  { name: 'Métricas', icon: 'chart-line', route: 'Metricas', scope: 'metricas:read' },
  { name: 'Tutoriales', icon: 'video', route: 'Tutoriales', scope: 'tutoriales:read' },
];
```

**Footer**:
- Botón "Cerrar sesión"

---

# HTTP y Manejo de API

## http.ts (Axios Instance)

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: agregar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: manejo de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      // Navegar a Login
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Servicios Ejemplo

```typescript
// login.service.ts
import api from './http';

export const loginService = {
  async login(usuario: string, password: string) {
    const { data } = await api.post('/login', { usuario, password });
    return data;
  },
};

// socios.service.ts
export const sociosService = {
  async list(params: { page: number; limit: number; search?: string }) {
    const { data } = await api.get('/api/socios', { params });
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/api/socios/${id}`);
    return data;
  },
  // ... resto de métodos
};
```

---

# Configuración de NativeWind (Tailwind)

## tailwind.config.js

```js
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626', // red-600
          dark: '#991B1B',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};
```

---

# Dark Mode

## ThemeContext.tsx

```typescript
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'auto';

export const ThemeContext = createContext({
  theme: 'auto' as Theme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved) setTheme(saved as Theme);
    });
  }, []);

  const isDark = theme === 'dark' || (theme === 'auto' && systemScheme === 'dark');

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

# Performance y Optimización

## Buenas Prácticas

1. **FlatList en vez de ScrollView** para listas largas
2. **React.memo** en componentes pesados
3. **useMemo/useCallback** para cálculos costosos
4. **Lazy loading** de imágenes con `expo-image`
5. **Debounce** en búsquedas
6. **Cache de API** con React Query o SWR
7. **Hermes engine** habilitado (default en Expo 50+)
8. **Bundle size** optimizado: `expo-optimize`

```typescript
// Ejemplo: Lista optimizada
<FlatList
  data={socios}
  renderItem={({ item }) => <SocioCard socio={item} />}
  keyExtractor={(item) => item.id.toString()}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

# Publicidad (Preparación)

## Integración AdMob (Futuro)

```bash
expo install expo-ads-admob
```

**Tipos de anuncios**:
1. **Banner**: Footer de pantallas secundarias
2. **Interstitial**: Entre navegación de pantallas
3. **Rewarded**: Para desbloquear contenido premium (si aplica)

**Ejemplo**:
```typescript
import { AdMobBanner } from 'expo-ads-admob';

<AdMobBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy"
  servePersonalizedAds
  onDidFailToReceiveAdWithError={(e) => console.log(e)}
/>
```

---

# Configuración de Publicación

## app.json

```json
{
  "expo": {
    "name": "FAP - Funcional Atlético",
    "slug": "fap-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./src/assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#DC2626"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/[your-project-id]"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.fap.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Necesitamos acceso a tu cámara para actualizar tu foto de perfil.",
        "NSPhotoLibraryUsageDescription": "Necesitamos acceso a tu galería para subir fotos."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/images/adaptive-icon.png",
        "backgroundColor": "#DC2626"
      },
      "package": "com.fap.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./src/assets/images/notification-icon.png",
          "color": "#DC2626"
        }
      ]
    ]
  }
}
```

## Comandos de Build

```bash
# Preview (desarrollo)
npx expo start

# Build iOS (requiere cuenta Apple Developer)
eas build --platform ios

# Build Android
eas build --platform android

# Submit a tiendas
eas submit --platform ios
eas submit --platform android
```

---

# Testing y Calidad

## Tests Esenciales

```bash
npm install --save-dev jest @testing-library/react-native
```

**Tests a implementar**:
1. **Login flow**: Credenciales correctas/incorrectas
2. **Navigation**: Navegación según roles
3. **API mocking**: Respuestas simuladas
4. **Snapshots**: Componentes visuales
5. **E2E**: Detox para flujos críticos

---

# Roadmap de Implementación

## Fase 1: Fundamentos (Semana 1-2)
- [ ] Setup de proyecto Expo + TypeScript
- [ ] Configuración NativeWind
- [ ] Estructura de carpetas
- [ ] Sistema de navegación básico
- [ ] AuthContext + LoginScreen
- [ ] HTTP service con interceptors

## Fase 2: Módulos Core (Semana 3-5)
- [ ] HomeScreen con saludo personalizado
- [ ] SociosModule (List + Detail + Create)
- [ ] PlanesModule (List + Detail)
- [ ] TurneroModule (Calendar + Inscripción)

## Fase 3: Módulos Secundarios (Semana 6-7)
- [ ] SuscripcionesModule
- [ ] EvaluacionesModule
- [ ] MetricasModule con charts
- [ ] TutorialesModule con video player

## Fase 4: Polish (Semana 8)
- [ ] PerfilScreen con edición
- [ ] Dark mode completo
- [ ] Animaciones y transiciones
- [ ] Error boundaries
- [ ] Loaders y skeletons
- [ ] Pull-to-refresh en todas las listas

## Fase 5: Testing y Publicación (Semana 9-10)
- [ ] Tests unitarios
- [ ] Tests E2E
- [ ] Optimización de performance
- [ ] Build para iOS y Android
- [ ] Submit a App Store y Google Play

---

# Checklist de Calidad

## UX/UI
- [ ] Touch targets mínimo 44x44px
- [ ] Feedback visual en todos los botones (press state)
- [ ] Loaders en operaciones async
- [ ] Mensajes de error claros
- [ ] Pull-to-refresh en listas
- [ ] Teclado se cierra al navegar
- [ ] Forms con validación inline
- [ ] Dark mode sin glitches

## Performance
- [ ] App inicia en < 3 segundos
- [ ] Navegación fluida (60fps)
- [ ] Listas largas con FlatList
- [ ] Imágenes optimizadas
- [ ] API calls cacheadas
- [ ] Bundle size < 30MB

## Accesibilidad
- [ ] accessibilityLabel en iconos
- [ ] Contraste de colores WCAG AA
- [ ] Text scaling soportado
- [ ] Screen reader compatible

## Seguridad
- [ ] Tokens en AsyncStorage (no Expo SecureStore por limitaciones)
- [ ] HTTPS obligatorio
- [ ] No hardcodear secrets
- [ ] Expiración de sesiones

---

# Entregables

1. **Código fuente**: Repositorio Git con estructura completa
2. **Documentación**: README con setup, arquitectura, y deployment
3. **Builds**: APK (Android) y IPA (iOS)
4. **Assets**: Logo, splash screen, iconos en resoluciones requeridas
5. **Credenciales**: Archivos para publicación en tiendas

---

# Notas Finales

- **Reutiliza tipos TypeScript** del proyecto web en `src/types/`
- **Mantén consistencia** con los nombres de servicios API del backend
- **Prioriza performance** sobre features complejas
- **Testea en dispositivos reales** (no solo simuladores)
- **Documenta permisos** requeridos por cada feature
- **Usa Expo DevTools** para debugging en tiempo real
- **Configura OTA updates** para hotfixes sin resubir a tiendas

---

# Recomendación Técnica Final

**¿Por qué React Native con Expo y no Flutter?**

1. **Máxima reutilización de código**: El proyecto usa React + TypeScript. Con React Native, podrás reutilizar gran parte de la lógica, hooks, tipos TypeScript, y servicios API existentes
2. **Performance nativa**: React Native compila a componentes nativos, garantizando excelente performance
3. **Expo**: Simplifica publicación en tiendas, manejo de notificaciones push, actualizaciones OTA, y tiene APIs para ads (AdMob) ya integradas
4. **Ecosistema maduro**: React Native Navigation, React Native Paper, expo-ads-admob para publicidad
5. **Menor curva de aprendizaje**: El equipo ya conoce React

---

**¿Preguntas sobre algún módulo o necesitas más detalles de implementación?**
