# Patrones de Diseño — Gestión del Fin Frontend

> Justificación técnica para defensa del proyecto. Documenta los patrones arquitectónicos, decisiones de diseño y su fundamento.

---

## 1. Gestión de Estado — Zustand con persistencia selectiva

### Patrón: Stores atómicos con barrel export

Cada dominio de estado vive en su propio archivo dentro de `src/store/`. Se usa un barrel export (`src/store/index.ts`) para que los consumidores importen desde un solo punto.

```ts
// src/store/index.ts
export { useAuthStore } from './auth';
export { useCampStore } from './camp';
export { useConnectionStore } from './connection';
export { useGamificationStore } from './gamification';
```

**Fundamento:** Zustand permite slices independientes sin un provider global ni boilerplate de Redux. Cada store es un módulo autocontenido con su interfaz TypeScript.

### Persistencia selectiva

| Store | Persistido | Razón |
|-------|:---:|-------|
| `auth` | ✓ | Token JWT y datos de usuario deben sobrevivir refrescos de página |
| `camp` | ✓ | El campamento seleccionado se mantiene entre navegaciones |
| `gamification` | ✓ | XP y logros persisten entre sesiones (por usuario) |
| `connection` | ✗ | Estado efímero de conexión WebSocket/ping |
| `toast` | ✗ | Notificaciones efímeras, no deben persistir |

**Fundamento:** Zustand `persist` middleware usa `localStorage` internamente. Solo se persiste lo que el usuario espera encontrar al volver.

### Lectura del store desde fuera de React

El API client (`src/lib/api.ts:19`) lee el token directamente del store sin hooks:

```ts
const token = useAuthStore.getState().token;
```

**Fundamento:** Los interceptores de Axios no son componentes React. `getState()` de Zustand permite acceso síncrono al estado fuera del árbol de React.

---

## 2. Cliente API — Axios con interceptores y proxy CORS

### Patrón: Instancia única con interceptores acoplados al estado global

```ts
export const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  config.baseURL = '/api-remote';           // Proxy Express → Railway
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    useConnectionStore.getState().setConnected();
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

**Fundamento:**
- **Una instancia:** consistencia en headers, base URL y manejo de errores.
- **Proxy `/api-remote`:** el frontend (Vite) y backend (Railway) están en orígenes distintos. El proxy Express (`server.ts`) evita CORS reenviando peticiones.
- **Interceptor de request:** adjunta el token JWT automáticamente. No hay que pasarlo manualmente en cada llamada.
- **Interceptor de response:** 401 fuerza logout y redirección. Errores de red notifican al store de conexión.

### Utilidades para respuestas paginadas

```ts
export const unwrapList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as any).data))
    return (data as { data: T[] }).data;
  return [];
};

export const toFormData = (values: Record<string, any>): FormData => {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value == null || value === '') continue;
    fd.append(key, value instanceof Blob ? value : String(value));
  }
  return fd;
};
```

**Fundamento:** El backend devuelve respuestas paginadas `{ data: T[], pagination: {...} }` en la mayoría de endpoints. `unwrapList` normaliza ambos formatos (array plano y paginado). `toFormData` se usa en endpoints multipart (creación de personas con foto, admisiones).

---

## 3. Control de Acceso — Permisos cliente con `can()`

### Patrón: Mapa rol → permisos con wildcard namespace

```ts
// src/lib/permissions.ts
const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: ['*'],
  resource_manager: ['inventory.*', 'transfers.*', 'people.read', ...],
  travel_coordinator: ['expeditions.*', 'transfers.create', ...],
  worker: ['dashboard.read', 'people.read', 'inventory.read', ...],
};

export function can(role: string | null | undefined, permission: string): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  for (const p of perms) {
    if (p === '*') return true;
    if (p === permission) return true;
    if (p.endsWith('.*') && permission.startsWith(p.slice(0, -2))) return true;
  }
  return false;
}
```

**Fundamento:**
- **Wildcard `*`:** system_admin tiene acceso total sin enumerar cada permiso.
- **Namespace `inventory.*`:** cubre `inventory.read`, `inventory.adjust`, etc. sin duplicación.
- **Cliente como UX, no seguridad:** `can()` es un gate de UI (esconde botones, filtra nav items). La seguridad real la aplica el backend con `permissionMiddleware`. Esto evita duplicar lógica de autorización pero da una experiencia fluida (el usuario no ve acciones que no puede ejecutar).
- **Mapeo local vs backend:** el mapa de permisos frontend es una simplificación deliberada. Los nombres de permisos reales del backend están en `src/shared/constants/permissions.ts` del API.

### Uso en navegación

```ts
const NAV_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'dashboard.read',
  '/inventory': 'inventory.read',
  '/expeditions': 'expeditions.read',
  // ...
};
const visibleNavItems = NAV_ITEMS.filter((item) =>
  can(user?.role, NAV_PERMISSIONS[item.to]),
);
```

**Fundamento:** El nav dock inferior se filtra por rol. Un worker no ve "Users", "Roles", "Permissions" en el dock.

---

## 4. Componentes Reutilizables

| Componente | Propósito | Por qué existe |
|---|---|---|
| `ConfirmDialog` | Modal de confirmación (danger/warning) | Evita repetir lógica de confirmación en cada feature. Soporta estado de carga (`isPending`) |
| `Pagination` | Navegación de páginas con botones « » | Todos los listados (PopulationRoster, TransferList, etc.) usan paginación idéntica |
| `Skeleton + SkeletonCard/List/Table/Grid` | Placeholders de carga composables | Evita layout shift durante carga. Compuesto de sub-componentes para distintos contextos |
| `ErrorBoundary` | Captura errores de renderizado | Evita que un error en una feature tumbe toda la app. Muestra UI de fallback con botón "Retry" |

---

## 5. Organización de Features

### Patrón: Flat feature folders, un componente por archivo

```
src/features/
  people/
    PopulationRoster.tsx
    PersonDetail.tsx
    NewPersonPage.tsx
  camps/
    CampManagement.tsx
    CampDetail.tsx
  inventory/
    InventoryList.tsx
    InventoryAudit.tsx
  ...
```

**Fundamento:**
- Cada feature es autónoma: imports de stores, API client, tipos y componentes compartidos.
- Sin barrel exports ni `index.ts` por feature: la ruta de import es directa (`../../store`, `../../lib/api`).
- Sin sub-carpetas `hooks/`, `types/`, `components/` por feature: los tipos están centralizados en `src/types.ts`, los hooks en `src/hooks/`, los componentes compartidos en `src/components/`.
- **Decisión consciente:** para un proyecto de esta escala (~20 features), la estructura plana es más navegable que una anidada. Si una feature creciera a 5+ archivos, se refactorizaría con sub-carpetas.

### Estructura interna canónica de una feature

1. `useState` para estado local (modal, formulario, edición)
2. `useQuery` con `queryKey: ['entidad', currentCampId]` para datos
3. `useMutation` con `onSuccess` → `queryClient.invalidateQueries()` para invalidación de caché
4. Funciones helper (`handleSubmit`, `resetForm`)
5. JSX con renderizado condicional: `isLoading ? <Skeleton /> : <Data />`

---

## 6. Layout — Shell fijo con Outlet + Sidebar

### Patrón: Header fijo + contenido animado + nav dock flotante

```
DashboardLayout
├── Header (fixed top)
│   ├── Branding (logo + título)
│   ├── Camp Switcher (<select>)
│   └── User chip + logout
├── Banners condicionales (desconexión, stock alerts)
├── Main content
│   ├── <Outlet /> con page transitions (AnimatePresence + motion.div)
│   └── GamificationWidget (sidebar derecha, lg+)
└── Nav dock (fixed bottom, floating pill)
    └── NavLink items filtrados por permisos
```

**Fundamento:**
- **Header fijo:** acceso permanente al camp switcher, hora del servidor y estado de conexión.
- **Page transitions:** `AnimatePresence` con `motion.div` keyed por `location.pathname` da transiciones suaves entre páginas.
- **Nav dock flotante:** diseño "mobile-first" — funciona igual en desktop y mobile.
- **Sidebar derecho:** el widget de gamificación se oculta en móvil (`hidden lg:block`) para no competir con el contenido.

---

## 7. Tipos — Archivo único con interfaces planas

### Patrón: `src/types.ts` concentra todos los modelos de dominio

**Fundamento:**
- **Una fuente de verdad:** todas las features importan de `../../types`. No hay tipos duplicados ni divergentes entre features.
- **Interfaces, no tipos condicionales:** las interfaces son extensibles y fáciles de leer. Los union types (`'HEALTHY' | 'SICK' | ...`) se usan para campos con valores acotados.
- **Campos opcionales generosos:** muchos campos son `?` para acomodar respuestas parciales del backend y estados de formulario donde el dato aún no se ingresó.
- **Comentarios de procedencia:** anotaciones como `// joined by some backends` o `// Real API status enum` documentan de dónde viene cada campo y por qué existe.

---

## 8. Sistema de Diseño — Brutalist + Tailwind

### Patrón: Utilidad `cn()` como wrapper de `clsx` + `tailwind-merge`

```ts
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Fundamento:**
- **`clsx`:** composición condicional de clases (`cn('base', isActive && 'active')`).
- **`tailwind-merge`:** resuelve conflictos de clases Tailwind (última clase gana). Evita que `px-4 py-2` sea sobrescrito por `p-0`.
- **Estilo brutalist:** clases como `brutalist-border`, `bg-surface-raised`, `bg-surface-base` definidas en `index.css`. Bordes duros, sombras mínimas, paleta oscura.

---

## 9. React Query — Fetching declarativo con invalidación

### Patrón: `useQuery` con keys que incluyen `currentCampId`

```ts
const { data } = useQuery({
  queryKey: ['people', currentCampId],
  queryFn: async () => {
    const res = await apiClient.get(`/camps/${currentCampId}/people`);
    return unwrapList(res.data);
  },
  enabled: !!currentCampId,
});
```

**Fundamento:**
- **Keys compuestas:** incluir `currentCampId` en la key asegura que cambiar de campamento invalida la caché y refetcha datos del nuevo campamento.
- **`enabled`:** evita peticiones antes de que `currentCampId` esté disponible (previene errores 400/404).
- **Invalidación post-mutación:** `queryClient.invalidateQueries({ queryKey: ['people'] })` en `onSuccess` refresca la lista sin recargar la página.

---

## 10. Animaciones — Framer Motion declarativo

### Patrón: `AnimatePresence` + `motion.div` para transiciones

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

**Fundamento:**
- **`mode="wait"`:** la página saliente termina su animación antes de que entre la nueva. Evita flickering.
- **`key={pathname}`:** fuerza re-mount y animación al cambiar de ruta.
- **Declarativo:** las animaciones se definen como props, no como código imperativo. Consistente con el modelo declarativo de React.

---

## Resumen de decisiones arquitectónicas

| Decisión | Alternativa considerada | Por qué esta |
|----------|------------------------|-------------|
| Zustand | Redux Toolkit, Context API | Menos boilerplate que Redux, más escalable que Context para estado frecuente |
| Axios con interceptores | fetch nativo, React Query `queryFn` directo | Manejo centralizado de auth, errores y conexión |
| Permisos cliente con `can()` | Solo confiar en backend | Mejor UX: el usuario no ve botones que devolverán 403 |
| `types.ts` único | Tipos por feature | Evita divergencia; 20 features no justifican fragmentación |
| Flat feature folders | `features/people/components/`, `hooks/`, etc. | Escala actual no requiere anidación; más simple de navegar |
| Tailwind + `cn()` | CSS Modules, styled-components | Co-localización de estilos con markup; sin nombres de clases inventados |
| `motion/react` | CSS transitions/animations | Animaciones de entrada/salida (`AnimatePresence`) no son posibles solo con CSS |
