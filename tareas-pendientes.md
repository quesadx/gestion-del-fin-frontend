# Tareas Pendientes — Gestión del Fin · Frontend

> Auditoría completa del estado del proyecto al 2026-05-19.
> Basada en evidencia directa del código fuente, documentación y configuración.

---

# Estado General del Proyecto

## Resumen

El proyecto tiene **14 módulos funcionales** (admission, auth, camps, explorations, inventory, people, professions, rations, resources, system, transfers, users) con su capa de API y hooks de TanStack Query implementados. Las rutas están definidas con lazy loading y protección RBAC. Sin embargo, el proyecto acumula **deuda técnica significativa** y varias funcionalidades documentadas como requisitos están incompletas o ausentes.

El pipeline `pnpm check` (lint + spell + build) existe pero no hay tests automatizados de ningún tipo. La documentación (`docs/`, `.planning/`) está parcialmente desactualizada respecto al código real.

## Problemas Críticos Detectados

1. **Tiempo del servidor nunca sincronizado** — `useServerTime()` nunca se invoca; el reloj del header nunca muestra la hora real del servidor (`src/shared/hooks/useServerTime.ts`, `src/layouts/AppShell.tsx:156`, `src/features/camps/store/camp.store.ts:18`)
2. **Sin Error Boundary** — fallos en lazy-loaded routes crashean la app completa
3. **0 tests** — sin Playwright, sin unit tests, sin CI/CD
4. **Violación de arquitectura** — `camp.store.ts` almacena `serverTime` (API data) en Zustand, contradiciendo la regla explícita de AGENTS.md
5. **`requested_by: 0` hardcodeado** en `TransfersPage.tsx:149` — todas las transferencias creadas desde el frontend tienen un `requested_by` inválido (el backend requiere `z.number().int().positive()`)
6. **Raza condition en 401 handler** (`axiosInstance.ts:31-47`) — si un segundo 401 llega dentro de la ventana de 2s, se ignora silenciosamente
7. **JWT decoding sin try-catch** en `auth.service.ts:12` — un token malformado crashea el flujo de login
8. **Duplicación masiva de módulos** — `resources.api.ts` existe en 2 lugares, `professions.api.ts` existe en 2 lugares, ambas con la misma TanStack Query key causando potencial corrupción de caché

## Funcionalidades Incompletas

| Funcionalidad                                            | Requisito | Estado                                                                         |
| -------------------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| AI-Powered Admission Evaluation (explicabilidad)         | RF-04     | Sin UI de `ai_reasoning`, `ai_decision` ni `ai_suggested_profession`           |
| Gamification (Threat Level, Days Survived, achievements) | RNF-03    | Cero implementación                                                            |
| LockScreen / session lock con password unlock            | RF-08     | Solo hay logout; no existe componente `LockScreen`                             |
| Rations — daily consumption processing                   | RF-06     | Una página plana sin API/hooks; usa parsing frágil de strings en `description` |
| Exploration Resource Allocation                          | RF-07     | Placeholder: "Resource allocation pending inventory integration"               |
| Dashboard role-specific views                            | RF-03     | Worker y travel_coordinator no tienen métricas reales                          |
| Responsive mobile layout                                 | —         | `use-mobile.tsx` existe pero no se usa; sidebar es fixed-width                 |
| `/resources/mine` (vista restringida worker)             | —         | No existe ruta, API, hook ni página                                            |

## Riesgos Técnicos

- **Sin tests** → cualquier cambio puede romper funcionalidad sin detección
- **Sin CI/CD** → no hay validación automática previa a despliegue
- **Tipado débil** → 15+ archivos de página usan `as Record<string, unknown>` en lugar de tipos definidos, haciendo frágiles los refactors
- **Manejo de errores inconsistente** → 10+ mutaciones sin try-catch ni toasts de feedback
- **Filtrado client-side rompe paginación** → `PeopleListPage` filtra datos localmente; solo se ven resultados de la página actual
- **Role list duplicada** → hardcodeada en `auth.service.ts:17` sin referenciar el tipo `Role`

---

# División de Responsabilidades

La división separa **infraestructura/sistema** (Persona A) de **páginas/UI** (Persona B), minimizando el solapamiento de archivos.

## Persona A — Infraestructura, Auth, API Layer, Tipo de Datos, Dead Code

**Área**: Capa compartida, autenticación, enrutamiento, estado global, tipos, tooling, limpieza, documentación.

### Tareas

#### A1. Sincronización del tiempo del servidor

- **Descripción**: El `useServerTime()` hook (`src/shared/hooks/useServerTime.ts`) nunca se llama. El `serverTime` en `camp.store.ts` siempre es `0`. El header del AppShell en línea 156 nunca muestra hora. Hay dos implementaciones duplicadas: una en `shared/hooks/` (usa Zustand) y otra en `features/system/hooks/` (usa TanStack Query).
- **Archivos**: `src/shared/hooks/useServerTime.ts`, `src/features/system/hooks/useServerTime.ts`, `src/features/camps/store/camp.store.ts`, `src/layouts/AppShell.tsx`, `src/App.tsx`
- **Solución propuesta**:
  1. Consolidar en una única implementación con TanStack Query (eliminar la de `shared/hooks/` que viola la regla de Zustand)
  2. Extraer `serverTime` de `camp.store.ts` (mover a TanStack Query únicamente)
  3. Invocar el hook de sincronización desde `App.tsx` o `AppShell.tsx`
  4. Eliminar `systems.api.ts` muerto en `src/shared/api/system.api.ts`
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Media

#### A2. Corrección de la raza condition del 401 handler

- **Descripción**: El interceptor de Axios (`axiosInstance.ts:31-47`) resetea `isHandling401` tras 2000ms con `setTimeout`. Si un segundo 401 llega en esa ventana, el `logout()` y redirect se saltan.
- **Archivos**: `src/shared/api/axiosInstance.ts`
- **Solución propuesta**: Usar una cola de promesas pendientes durante el handling de 401 en lugar de un flag booleano con timeout. Reintentar requests pendientes después del re-login.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Media

#### A3. JWT decoding con manejo de errores

- **Descripción**: `auth.service.ts:12` hace `JSON.parse(atob(parts[1]))` sin try-catch. Un token malformado crashea el login. Además, la lista de roles permitidos en línea 17 está hardcodeada en lugar de usar el tipo `Role`.
- **Archivos**: `src/features/auth/auth.service.ts`, `src/features/auth/types/auth.types.ts`
- **Solución propuesta**:
  1. Envolver `JSON.parse(atob(...))` en try-catch con error descriptivo
  2. Reemplazar el array hardcodeado por una referencia al union type `Role`
  3. Agregar validación de `userId` como `Number.isInteger`
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A4. Dedo duplicación de módulos API/hooks

- **Descripción**: `resources.api.ts` y `useResources.ts` existen idénticos en `features/inventory/` y `features/resources/`. Lo mismo para `professions.api.ts` y `useProfessions.ts` en `features/people/` y `features/professions/`. Ambas usan la misma TanStack Query key (`['resources']`, `['professions']`), causando potencial corrupción de caché.
- **Archivos**: `src/features/resources/api/resources.api.ts`, `src/features/inventory/api/resources.api.ts`, `src/features/resources/hooks/useResources.ts`, `src/features/inventory/hooks/useResources.ts`, `src/features/people/api/professions.api.ts`, `src/features/professions/api/professions.api.ts`, `src/features/people/hooks/useProfessions.ts`, `src/features/professions/hooks/useProfessions.ts`
- **Solución propuesta**:
  1. Consolidar `resources.api.ts` y `useResources.ts` — eliminar una copia y actualizar imports
  2. Consolidar `professions.api.ts` y `useProfessions.ts` — eliminar una copia y actualizar imports
  3. Verificar que los `index.ts` barrel exports de ambos módulos funcionen correctamente tras la consolidación
- **Prioridad**: Alta
- **Dependencias**: A5 (tipos deben ser consistentes primero)
- **Complejidad estimada**: Media

#### A5. Tipado de respuestas API — crear `PaginatedResponse<T>` genérico

- **Descripción**: Cada endpoint retorna `res.data` sin tipo. Los consumidores usan `as Record<string, unknown>`. Se necesita un tipo genérico `PaginatedResponse<T>` para respuestas paginadas y usarlo consistentemente en todas las API functions.
- **Archivos**: `src/shared/api/types.ts`, `src/features/*/api/*.api.ts`
- **Solución propuesta**:
  1. Agregar `PaginatedResponse<T>` a `shared/api/types.ts`
  2. Tipar todas las API functions con `Promise<PaginatedResponse<Camp>>` etc.
  3. Revisar inconsistencia: algunas API retornan `res.data` (wrapper) y otras `res.data.data` (array plano). Estandarizar a `res.data` con tipo genérico.
  4. Mover `LoginRequest`/`LoginResponse` de `shared/api/types.ts` a `features/auth/types/auth.types.ts`
- **Prioridad**: Alta
- **Dependencias**: Ninguna (prerequisito para A4 y tareas de Persona B)
- **Complejidad estimada**: Alta

#### A6. Tipos duplicados — unificar `CampStatus` y `PersonStatus`

- **Descripción**: `CampStatus` definido en `camps/api/camps.api.ts:4` y `camps/types/camp.types.ts:1`. `PersonStatus` definido en 3 lugares: `people/api/people.api.ts:4`, `explorations/api/explorations.api.ts:4`, `transfers/api/transfers.api.ts:11`. Debe haber una sola fuente canónica por tipo.
- **Archivos**: `src/features/camps/api/camps.api.ts`, `src/features/camps/types/camp.types.ts`, `src/features/people/api/people.api.ts`, `src/features/explorations/api/explorations.api.ts`, `src/features/transfers/api/transfers.api.ts`
- **Solución propuesta**: Mover todas las definiciones de tipo a los archivos `types/` correspondientes y hacer que los `api/` importen desde allí. Para `PersonStatus` que se usa en 3 features, mover a un tipo compartido.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A7. Error Boundary para lazy-loaded routes

- **Descripción**: No existe ningún `ErrorBoundary` en la app. Si una ruta lazy-loaded falla al cargarse (error de red, chunk missing), la app crashea completamente.
- **Archivos**: Nuevo archivo `src/components/ErrorBoundary.tsx`, `src/routes/AppRoutes.tsx`
- **Solución propuesta**: Crear un `ErrorBoundary` con React error boundary pattern (class component o `react-error-boundary`). Envolver el `<Suspense>` de cada lazy route.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A8. Event listeners de inactividad sin debounce

- **Descripción**: `auth-context.tsx:24` dispara `handleActivity()` en cada `mousedown`, `keydown`, `scroll` y `touchstart`. Cada evento llama `updateActivity()` que dispara `set()` en Zustand. Esto causa actualizaciones de store en cada tecla y movimiento del mouse.
- **Archivos**: `src/features/auth/auth-context.tsx`
- **Solución propuesta**: Aplicar throttle (ej. 5 segundos mínimo entre actualizaciones de actividad) o usar un patrón de debounce con `useRef` para la última actividad.
- **Prioridad**: Media
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A9. `lastActivity` no persistido en el store

- **Descripción**: `auth.store.ts:59-63` — `lastActivity` no está en la lista `partialize`. Al recargar la página, `lastActivity` se resetea a `Date.now()`, dando otros 20 minutos de gracia aunque el usuario llevara 19 minutos inactivo.
- **Archivos**: `src/features/auth/store/auth.store.ts`
- **Solución propuesta**: Agregar `lastActivity` a `partialize` o calcular el timeout basado en el timestamp del token JWT (`iat`).
- **Prioridad**: Media
- **Dependencias**: A8
- **Complejidad estimada**: Baja

#### A10. Limpiar archivos vacíos y dead code

- **Descripción**: 5 archivos vacíos (`App.css`, `fonts.css`, `tokens.css`, `scanlines.css` no usado, `system.api.ts` en shared muerto). 13 motion variants en `motion.ts` sin ningún uso. Legacy navigation components (`Navbar.tsx`, `DockBar.tsx` no usados con AppShell). Directorio `temp/neon-nova-dashboard/` (~2100 líneas de código scaffold).
- **Archivos**: `src/App.css`, `src/app/styles/fonts.css`, `src/app/styles/tokens.css`, `src/app/styles/scanlines.css`, `src/shared/api/system.api.ts`, `src/shared/lib/motion.ts`, `src/components/navigation/Navbar.tsx`, `src/components/navigation/DockBar.tsx`, `temp/neon-nova-dashboard/`
- **Solución propuesta**: Eliminar archivos vacíos y no importados. Eliminar `motion.ts` (o conservar solo las variantes en uso real). Eliminar `temp/`. Si `Navbar` y `DockBar` son legacy según AGENTS.md, eliminarlos.
- **Prioridad**: Media
- **Dependencias**: Verificar imports de `motion.ts` antes de eliminar
- **Complejidad estimada**: Baja

#### A11. Clases CSS vacías en `globals.css`

- **Descripción**: `globals.css:249-256` define 6 clases (`.corner-brackets`, `.animate-pulse-soft`, `.hover-lift`, `.animate-breathe`, `.animate-breathe-border`, `.animate-pulse-glow`) sin propiedades. Dos de ellas (`.animate-pulse-soft`, `.animate-pulse-glow`) se usan en JSX pero no producen efecto visual.
- **Archivos**: `src/app/styles/globals.css`
- **Solución propuesta**: Eliminar clases no usadas. Agregar las propiedades CSS faltantes a `.animate-pulse-soft` y `.animate-pulse-glow` o eliminar su uso en JSX.
- **Prioridad**: Baja
- **Dependencias**: Verificar uso en JSX antes de eliminar
- **Complejidad estimada**: Baja

#### A12. `queryClient.invalidateQueries()` sin filtro en AppShell

- **Descripción**: `AppShell.tsx:35` llama `queryClient.invalidateQueries()` sin query key. Cada cambio de campamento seleccionado refetcha **todas** las queries activas. Debería invalidar solo queries con scope de campamento.
- **Archivos**: `src/layouts/AppShell.tsx`
- **Solución propuesta**: Usar `queryClient.invalidateQueries({ predicate: (query) => query.queryKey.includes('camps') })` o un array de keys específicas.
- **Prioridad**: Media
- **Dependencias**: A5 (tipos de query keys estandarizados)
- **Complejidad estimada**: Baja

#### A13. Role list duplicada y permisos inconsistentes

- **Descripción**: `auth.service.ts:17` tiene roles hardcodeados. `useNavItems.ts:97` retorna TODOS los nav items cuando `role` es null. `useNavItems.ts:91` lista rations para `system_admin, resource_manager` pero `DashboardPage.tsx:111` también incluye `worker`.
- **Archivos**: `src/features/auth/auth.service.ts`, `src/hooks/useNavItems.ts`, `src/shared/lib/roleGuards.ts`
- **Solución propuesta**:
  1. Centralizar la validación de roles usando el tipo `Role`
  2. `useNavItems` debe retornar `[]` o solo items públicos cuando `role === null`
  3. Estandarizar permisos de rations entre `useNavItems` y `DashboardPage`
- **Prioridad**: Media
- **Dependencias**: A3
- **Complejidad estimada**: Baja

#### A14. `ReactQueryDevtools` en bundle de producción

- **Descripción**: `App.tsx:28` renderiza `<ReactQueryDevtools />` incondicionalmente. No se usa `import.meta.env.DEV` para excluirlo del build de producción.
- **Archivos**: `src/App.tsx`
- **Solución propuesta**: Envolver con `{import.meta.env.DEV && <ReactQueryDevtools />}` o usar dynamic import condicional.
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A15. Retraso artificial de 600ms en App.tsx

- **Descripción**: `App.tsx:14` tiene `setTimeout(() => setReady(true), 600)` que fuerza a todos los usuarios a esperar 600ms aunque la app ya cargó. Es puramente cosmético.
- **Archivos**: `src/App.tsx`
- **Solución propuesta**: Eliminar el `setTimeout` y usar `setReady(true)` inmediatamente después de hidratar el estado, o usar el estado de hidratación de Zustand (`_hasHydrated`).
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A16. Logger expone errores en producción

- **Descripción**: `logger.ts:14-16` siempre imprime errores a consola, incluso en producción. Podría leakear tokens JWT, datos de usuario, o respuestas de API.
- **Archivos**: `src/shared/utils/logger.ts`
- **Solución propuesta**: Condicionar `logger.error` con `import.meta.env.DEV` o enviar a un servicio externo de logging en producción (ej. Sentry) en lugar de `console.error`.
- **Prioridad**: Media
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A17. Inconsistencia de `zodResolver` vs wrapper `resolved`

- **Descripción**: `ExplorationsPage.tsx:4` y `LoginPage.tsx:5` importan `zodResolver` directamente. Todas las demás páginas usan el wrapper `resolved` de `@/shared/lib/form`. Inconsistencia en convención.
- **Archivos**: `src/features/explorations/pages/ExplorationsPage.tsx` (import en línea 4), `src/pages/LoginPage.tsx` (import en línea 5)
- **Solución propuesta**: Cambiar ambos imports a usar `resolved` de `@/shared/lib/form`.
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### A18. Actualizar documentación obsoleta

- **Descripción**: `ENDPOINT_IMPLEMENTATION_WORKFLOW.md` marca `GET /resources`, `GET /professions`, `GET /users` como "pending" cuando ya están implementados. `MILESTONES.md` tiene 0 checkboxes completados. `ROLES_ACCESS.md` aún menciona `travel_lead` cuando el código usa `travel_coordinator`. `README.md` es el template default de Vite sin contenido del proyecto.
- **Archivos**: `docs/ENDPOINT_IMPLEMENTATION_WORKFLOW.md`, `docs/MILESTONES.md`, `docs/ROLES_ACCESS.md`, `docs/API_CONTRACT.md`, `README.md`
- **Solución propuesta**:
  1. Actualizar `ENDPOINT_IMPLEMENTATION_WORKFLOW.md` con el estado real
  2. Marcar milestones completados que ya están implementados
  3. Corregir `travel_lead` → `travel_coordinator` en `ROLES_ACCESS.md`
  4. Reescribir `README.md` con setup instructions, arquitectura y scripts
- **Prioridad**: Media
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

---

## Persona B — Páginas de Features, Componentes UI, UX

**Área**: Todas las páginas de features, componentes visuales, dashboard, login, nuevos componentes faltantes, toasts, manejo de errores en UI.

### Tareas

#### B1. Agregar toasts de feedback en mutaciones sin respuesta al usuario

- **Descripción**: 15+ mutaciones en el proyecto se ejecutan sin toast de éxito o error. El usuario no sabe si la acción se completó o falló.
  - `InventoryPage.tsx:74-83` — `createAdjustment` sin toast
  - `ResourcesPage.tsx:78-94` — create, update, delete sin toasts
  - `TransfersPage.tsx:159-175` — approve, complete, schedule sin toasts
  - `AdmissionsPage.tsx:60-78` — create, review sin toasts
  - `ProfessionsPage.tsx:84,96-98` — update, delete sin toasts
  - `CampsPage.tsx:72-73,87` — errores van a `setCreateError` local, no a toast
- **Archivos**: `src/features/inventory/pages/InventoryPage.tsx`, `src/features/inventory/pages/ResourcesPage.tsx`, `src/features/resources/pages/ResourcesPage.tsx`, `src/features/transfers/pages/TransfersPage.tsx`, `src/features/admission/pages/AdmissionsPage.tsx`, `src/features/professions/pages/ProfessionsPage.tsx`, `src/features/camps/pages/CampsPage.tsx`
- **Solución propuesta**: Envolver cada `mutateAsync()` en try-catch y llamar `toast()` en success y error. Usar el sistema de toast existente en `@/shared/lib/toast`.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja (muchas ubicaciones, pero patrón repetitivo)

#### B2. Try-catch en mutaciones que carecen de manejo de errores

- **Descripción**: Además de los toasts, varias mutaciones llaman `mutateAsync()` sin try-catch, dejando promesas rechazadas sin manejar:
  - `InventoryPage.tsx:74-83`
  - `ResourcesPage.tsx:78-94`
  - `TransfersPage.tsx:159-175`
  - `AdmissionsPage.tsx:60-78`
  - `rations/pages/RationsPage.tsx:92-113`
- **Archivos**: Los mismos que B1 más `src/features/rations/pages/RationsPage.tsx`
- **Solución propuesta**: Misma que B1 — try-catch + toast.
- **Prioridad**: Alta
- **Dependencias**: B1 (se hacen juntos)
- **Complejidad estimada**: Baja

#### B3. `requested_by: 0` hardcodeado en TransfersPage

- **Descripción**: `TransfersPage.tsx:149` — `requested_by: 0`. El backend espera `z.number().int().positive()`. `0` no es un ID de usuario válido.
- **Archivos**: `src/features/transfers/pages/TransfersPage.tsx`
- **Solución propuesta**: Obtener `userId` de `useAuthStore((state) => state.userId)` y usarlo en lugar de `0`.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B4. `FileInput` sobreescribe campo `identification_code` con data URL

- **Descripción**: `PersonCreatePage.tsx:310-314` — el segundo `<FileInput>` llama `setValue('identification_code', dataUrl)`. `identification_code` es un campo de texto para códigos de identificación ("ID-XXX-###"), pero se sobreescribe con un base64 data URL de `FileReader`. Es un bug de corrupción de datos.
- **Archivos**: `src/features/people/pages/PersonCreatePage.tsx`
- **Solución propuesta**: Revisar la lógica de `FileInput`. Probablemente debería ser un campo separado (`photo` o `avatar_url`) o el `setValue` debe asignarse al campo correcto según el propósito del `FileInput`.
- **Prioridad**: Alta
- **Dependencias**: Revisar el schema de creación de persona en el backend
- **Complejidad estimada**: Baja

#### B5. `prompt()` nativo en TransfersPage

- **Descripción**: `TransfersPage.tsx:172` usa `prompt('Delivery date (YYYY-MM-DDTHH:mm):')`. Es un diálogo bloqueante del navegador sin validación ni estilo.
- **Archivos**: `src/features/transfers/pages/TransfersPage.tsx`
- **Solución propuesta**: Reemplazar con un `<Dialog>` que contenga un `<input type="datetime-local">` con validación.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Media

#### B6. AlertDialog sticky en ExplorationsPage sin escape

- **Descripción**: `ExplorationsPage.tsx:755` — `onOpenChange={() => {}}` hace que el AlertDialog de cambio de estado no se pueda cerrar con Escape ni click fuera. Solo se cierra con el botón Cancel.
- **Archivos**: `src/features/explorations/pages/ExplorationsPage.tsx`
- **Solución propuesta**: Reemplazar el handler vacío con uno que cierre el diálogo, o usar `onOpenChange={(open) => !open && setStatusTarget(null)}`.
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B7. Filtrado client-side rompe paginación en PeopleListPage

- **Descripción**: `PeopleListPage.tsx` aplica `searchTerm`, `statusFilter`, y `professionFilter` localmente sobre los datos de la página actual. Si hay 100 personas en 5 páginas y el usuario busca, solo ve resultados de la página 1.
- **Archivos**: `src/features/people/pages/PeopleListPage.tsx`
- **Solución propuesta**: Enviar los filtros como query params al API o implementar filtrado server-side si el backend lo soporta. Como mínimo, mostrar un mensaje al usuario advirtiendo que la búsqueda es solo en la página actual.
- **Prioridad**: Alta
- **Dependencias**: Verificar si el backend soporta filtros en GET /people
- **Complejidad estimada**: Media

#### B8. RationsPage — arrays vacíos por mal acceso a paginated responses

- **Descripción**: `RationsPage.tsx:45-46` — `Array.isArray(people)` es `false` porque `usePeople` retorna el wrapper `{ data, pagination }`, no un array. Lo mismo para `campsArray` en línea 42. Los `<select>` de persona y campamento siempre están vacíos.
- **Archivos**: `src/features/rations/pages/RationsPage.tsx`
- **Solución propuesta**: Acceder a `people.data` o `people?.data` en lugar de `people` directamente. Agregar `Array.isArray()` sobre el array interno.
- **Prioridad**: Alta
- **Dependencias**: A5 (tipos de respuesta estandarizados)
- **Complejidad estimada**: Baja

#### B9. RationsPage — parsing frágil de descripciones

- **Descripción**: `RationsPage.tsx:95,189-195` — los datos de ración se codifican como string formateado en el campo `description`: `RATION: person=NAME person_id=X resource=Y consumed_at=Z notes=NOTES`. Se parsean con regex en tiempo de display:
  - `desc.match(/person=([^ ]+)/)` — falla si el nombre contiene espacios
  - `desc.match(/consumed_at=([^ ]+)/)` — falla si la fecha contiene espacios
- **Archivos**: `src/features/rations/pages/RationsPage.tsx`
- **Solución propuesta**: Si el backend soporta un endpoint dedicado de rations, usarlo. Si no, mejorar el parsing con delimitadores no ambiguos (ej. usar `|` como separador en lugar de espacios) o separar los campos con JSON en el description.
- **Prioridad**: Alta
- **Dependencias**: Verificar endpoint de rations en el backend
- **Complejidad estimada**: Media

#### B10. Confirmación de acciones destructivas faltante

- **Descripción**: `TransfersPage.tsx:300-354` — Approve, Complete y Schedule se ejecutan sin confirmación. Solo Reject tiene confirmación.
- **Archivos**: `src/features/transfers/pages/TransfersPage.tsx`
- **Solución propuesta**: Agregar `AlertDialog` de confirmación para todas las acciones de transferencia, no solo reject.
- **Prioridad**: Media
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B11. Acción de delete directa sin confirmación

- **Descripción**: `PersonDetailPage.tsx:714` — botón "TERMINATE" posiblemente actúa sin confirmación explícita. `PeopleListPage.tsx` y `TransfersPage.tsx` usan AlertDialog para confirmar.
- **Archivos**: `src/features/people/pages/PersonDetailPage.tsx`
- **Solución propuesta**: Verificar que el AlertDialog esté correctamente configurado (la variable `deleteTarget` es `boolean` en lugar de objeto, lo cual es semánticamente confuso pero funcional). Confirmar que el flujo de confirmación existe.
- **Prioridad**: Media
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B12. Status "DECEASED" vs "DEAD" mismatch en UI

- **Descripción**: `PeopleListPage.tsx:173-174` — el `<option>` muestra "DECEASED" pero el `value` es `"DEAD"`. Confunde al usuario que filtra por lo que lee en el dropdown.
- **Archivos**: `src/features/people/pages/PeopleListPage.tsx`
- **Solución propuesta**: Alinear display text con value: ambos "DEAD" o ambos "DECEASED".
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B13. `Date.now()` para business logic en páginas

- **Descripción**: AGENTS.md exige "Server time for business logic, not Date.now()". Los siguientes usan `Date.now()` o `new Date()`:
  - `PersonCreatePage.tsx:56,67` — `admission_date` default y submit
  - `PersonDetailPage.tsx:128` — campo `created_at`
  - `RationsPage.tsx:68` — `consumed_at`
- **Archivos**: `src/features/people/pages/PersonCreatePage.tsx`, `src/features/people/pages/PersonDetailPage.tsx`, `src/features/rations/pages/RationsPage.tsx`
- **Solución propuesta**: Usar `getServerNow()` del hook de sistema (depende de que Persona A arregle la sincronización en A1).
- **Prioridad**: Media
- **Dependencias**: A1 (tiempo del servidor funcional)
- **Complejidad estimada**: Baja

#### B14. Placeholder notices en ExplorationsPage

- **Descripción**: `ExplorationsPage.tsx:577-584` — dos cajas de info hardcodeadas: "Resource allocation pending inventory integration" y "Found resources can be recorded when return flow is connected". Son placeholders que deben reemplazarse con funcionalidad real o eliminarse.
- **Archivos**: `src/features/explorations/pages/ExplorationsPage.tsx`
- **Solución propuesta**: Implementar la integración real (B15) o reemplazar con UI que indique el estado real de la funcionalidad.
- **Prioridad**: Media
- **Dependencias**: B15
- **Complejidad estimada**: Baja

#### B15. AI Explainability — mostrar `ai_reasoning`, `ai_decision`, `ai_suggested_profession`

- **Descripción**: El backend devuelve campos de AI en el endpoint de admission (`BACKEND_SCHEMAS.md`). Cero matches de `ai_reasoning` o `ai_suggested` en ningún `.tsx`. Se necesita UI para mostrar la decisión de la AI, su razonamiento, y permitir override manual.
- **Archivos**: `src/features/admission/pages/AdmissionsPage.tsx`, nuevo componente `src/features/admission/components/AIAnalysisPanel.tsx`
- **Solución propuesta**:
  1. Crear un componente `AIAnalysisPanel` que muestre `ai_decision`, `ai_reasoning`, `ai_suggested_profession`
  2. Integrarlo en el flujo de review de admissions
  3. Permitir al admin aceptar o override la decisión de la AI
- **Prioridad**: Alta
- **Dependencias**: Ninguna
- **Complejidad estimada**: Media

#### B16. StatusBadge — variantes con nombres confusos y duplicados

- **Descripción**: `StatusBadge.tsx` mapea `variant='cyan'` a colores rojos y `variant='red'` a los mismos colores rojos (idénticos). `variant='purple'` mapea a ámbar. Los nombres no corresponden a los colores renderizados.
- **Archivos**: `src/components/cyber/StatusBadge.tsx`
- **Solución propuesta**: Renombrar variantes para que coincidan con los colores reales (ej. `cyan` → `red`, `purple` → `amber`) o eliminar la variante duplicada. Actualizar todos los usos en páginas.
- **Prioridad**: Media
- **Dependencias**: Revisar todos los usos de StatusBadge en features
- **Complejidad estimada**: Baja

#### B17. Panel — tipo `accent` restrictivo

- **Descripción**: `Panel.tsx:9` — `accent?: 'cyan' | 'purple'` solo acepta dos valores, pero `StatCard` soporta 4. `CampDetailPage.tsx:123` tiene que mapear `green → cyan` para hacerlo funcionar.
- **Archivos**: `src/components/cyber/Panel.tsx`, `src/features/camps/pages/CampDetailPage.tsx`
- **Solución propuesta**: Expandir el tipo de `accent` en `Panel` para aceptar los mismos valores que `StatCard` (`'cyan' | 'purple' | 'green' | 'red'`) y actualizar los estilos condicionales.
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B18. `CampDetailPage` — campId NaN en URL inválida

- **Descripción**: `CampDetailPage.tsx:29` — `const campId = Number(id)`. Si el param `:id` es no numérico, `campId` es `NaN`. La línea 80 renderiza `tag={`CAMP.${NaN}`}` que muestra "CAMP.NaN".
- **Archivos**: `src/features/camps/pages/CampDetailPage.tsx`
- **Solución propuesta**: Validar que `campId` sea un número finito positivo antes de usarlo. Redirigir a 404 o mostrar mensaje de error si no es válido.
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B19. Índice de array como fallback de React key

- **Descripción**: `PersonDetailPage.tsx:362` — `key={(log.id as number) || i}`. `ExplorationDetailPage.tsx:158,188,221` — mismo patrón. Usar índice de array como fallback causa re-renders innecesarios y puede romper estado de componentes.
- **Archivos**: `src/features/people/pages/PersonDetailPage.tsx`, `src/features/explorations/pages/ExplorationDetailPage.tsx`
- **Solución propuesta**: Asegurar que cada item tenga un ID único del backend. Si no, generar uno al mapear con `crypto.randomUUID()` o usar una combinación de campos únicos.
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B20. Eliminar tipos `as Record<string, unknown>` en páginas

- **Descripción**: 15+ páginas usan `as Record<string, unknown>` para acceder a datos de API, ignorando los tipos definidos en `types/`. Esto contradice AGENTS.md ("No any or as any. TypeScript strict.").
  - `CampsPage.tsx:118-122`
  - `CampDetailPage.tsx:104-108,216`
  - `PeopleListPage.tsx:48-56`
  - `PersonDetailPage.tsx` (múltiples líneas)
  - `InventoryPage.tsx:205`
  - `TransfersPage.tsx` (múltiples líneas)
  - Y más
- **Archivos**: Todos los archivos de página en `src/features/*/pages/`
- **Solución propuesta**: Reemplazar todos los `as Record<string, unknown>` con los tipos definidos (`Camp`, `Resource`, `Person`, `Transfer`, etc.) una vez que Persona A complete A5 (tipos de respuesta API).
- **Prioridad**: Alta
- **Dependencias**: A5 (`PaginatedResponse<T>` genérico)
- **Complejidad estimada**: Alta (muchas ubicaciones, requiere A5 completado primero)

#### B21. Dashboard — extraer `useStats` a hook separado

- **Descripción**: `DashboardPage.tsx:23-61` define `useStats` como función privada inline. La convención del proyecto es hooks en archivos separados.
- **Archivos**: `src/pages/DashboardPage.tsx`, nuevo archivo `src/hooks/useDashboardStats.ts`
- **Solución propuesta**: Mover `useStats` a `src/hooks/useDashboardStats.ts`.
- **Prioridad**: Baja
- **Dependencias**: Ninguna
- **Complejidad estimada**: Baja

#### B22. Responsive layout — implementar drawer en mobile

- **Descripción**: `use-mobile.tsx` hook existe pero no se usa en `AppShell`. El sidebar es fixed-width (w-64/w-16) sin adaptación mobile.
- **Archivos**: `src/layouts/AppShell.tsx`, `src/hooks/use-mobile.tsx`
- **Solución propuesta**: Usar el hook `use-mobile` en `AppShell` y renderizar un drawer/sheet en mobile en lugar del sidebar fijo. Usar `Sheet` de shadcn/ui.
- **Prioridad**: Baja
- **Dependencias**: Coordinar con Persona A (AppShell es compartido, pero la modificación es solo de UI responsive)
- **Complejidad estimada**: Media

---

# Separación Técnica Recomendada

## Persona A — Carpetas y archivos

| Área                 | Archivos                                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared API**       | `src/shared/api/axiosInstance.ts`, `src/shared/api/types.ts`                                                                                                                                                                           |
| **Shared lib**       | `src/shared/lib/queryClient.ts`, `src/shared/lib/form.ts`, `src/shared/lib/motion.ts`, `src/shared/lib/roleGuards.ts`, `src/shared/lib/toast.tsx`                                                                                      |
| **Shared utils**     | `src/shared/utils/logger.ts`                                                                                                                                                                                                           |
| **Shared hooks**     | `src/shared/hooks/useServerTime.ts` (eliminar o consolidar)                                                                                                                                                                            |
| **Shared guards**    | `src/shared/guards/RoleGate.tsx`                                                                                                                                                                                                       |
| **Auth**             | `src/features/auth/` (todo el módulo)                                                                                                                                                                                                  |
| **System**           | `src/features/system/` (todo el módulo)                                                                                                                                                                                                |
| **Routing**          | `src/routes/AppRoutes.tsx`, `src/routes/ProtectedRoute.tsx`, nuevo `ErrorBoundary`                                                                                                                                                     |
| **Layout**           | `src/layouts/AppShell.tsx` (solo fixes de serverTime + queryClient invalidation)                                                                                                                                                       |
| **Styles**           | `src/app/styles/globals.css`, `src/app/styles/fonts.css`, `src/app/styles/tokens.css`, `src/app/styles/scanlines.css`                                                                                                                  |
| **Root**             | `src/App.tsx`, `src/App.css`, `src/main.tsx`, `index.html`                                                                                                                                                                             |
| **Hooks**            | `src/hooks/useNavItems.ts`, `src/hooks/use-mobile.tsx`                                                                                                                                                                                 |
| **Lib**              | `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `src/lib/utils.ts`                                                                                                                                                                |
| **Config**           | `eslint.config.js`, `.prettierrc`, `cspell.json`, `tailwind.config.js`, `vite.config.ts`, `tsconfig.*.json`                                                                                                                            |
| **Types (features)** | `src/features/camps/types/`, `src/features/camps/api/camps.api.ts` (solo tipos), `src/features/people/api/`, `src/features/explorations/api/`, `src/features/transfers/api/`, `src/features/*/api/` (solo tipado, no lógica de página) |
| **Dedup**            | Eliminar `src/features/resources/api/` duplicado o `src/features/inventory/api/resources.api.ts` duplicado                                                                                                                             |
| **Dead code**        | `src/shared/api/system.api.ts`, `temp/`, `src/components/navigation/Navbar.tsx`, `src/components/navigation/DockBar.tsx`                                                                                                               |
| **Docs**             | `docs/`, `.planning/`, `README.md`                                                                                                                                                                                                     |

## Persona B — Carpetas y archivos

| Área                   | Archivos                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Camps pages**        | `src/features/camps/pages/CampsPage.tsx`, `src/features/camps/pages/CampDetailPage.tsx`                                                                                                                             |
| **People pages**       | `src/features/people/pages/PeopleListPage.tsx`, `src/features/people/pages/PersonCreatePage.tsx`, `src/features/people/pages/PersonDetailPage.tsx`                                                                  |
| **Inventory pages**    | `src/features/inventory/pages/InventoryPage.tsx`, `src/features/inventory/pages/InventoryAuditPage.tsx`, `src/features/inventory/pages/ResourcesPage.tsx`, `src/features/inventory/components/StockAlertBanner.tsx` |
| **Resources pages**    | `src/features/resources/pages/ResourcesPage.tsx`                                                                                                                                                                    |
| **Explorations pages** | `src/features/explorations/pages/ExplorationsPage.tsx`, `src/features/explorations/pages/ExplorationDetailPage.tsx`                                                                                                 |
| **Transfers pages**    | `src/features/transfers/pages/TransfersPage.tsx`                                                                                                                                                                    |
| **Admission pages**    | `src/features/admission/pages/AdmissionsPage.tsx`                                                                                                                                                                   |
| **Users pages**        | `src/features/users/pages/UsersPage.tsx`                                                                                                                                                                            |
| **Professions pages**  | `src/features/professions/pages/ProfessionsPage.tsx`                                                                                                                                                                |
| **Rations pages**      | `src/features/rations/pages/RationsPage.tsx`                                                                                                                                                                        |
| **Dashboard**          | `src/pages/DashboardPage.tsx`                                                                                                                                                                                       |
| **Login**              | `src/pages/LoginPage.tsx`                                                                                                                                                                                           |
| **Cyber components**   | `src/components/cyber/StatusBadge.tsx`, `src/components/cyber/Panel.tsx`, otros según necesidad                                                                                                                     |
| **Nuevos componentes** | `src/components/LockScreen.tsx`, `src/features/admission/components/AIAnalysisPanel.tsx`                                                                                                                            |
| **Hooks**              | `src/hooks/useDashboardStats.ts` (nuevo, extraído de DashboardPage)                                                                                                                                                 |

## Puntos de conflicto potenciales

| Archivo                                         | Riesgo                                           | Mitigación                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/layouts/AppShell.tsx`                      | Ambas personas pueden necesitar tocarlo          | Persona A solo toca líneas 19, 24-28 (serverTime) y 35 (queryClient). Persona B solo toca la parte de responsive layout (nuevo drawer). Áreas no solapadas. |
| `src/pages/LoginPage.tsx`                       | Persona B tiene B1 (toasts) y A17 (zodResolver)  | Coordinar: Persona A hace el cambio de `zodResolver` → `resolved` primero. Persona B agrega toasts después.                                                 |
| `src/features/*/api/` y `src/features/*/types/` | Persona A refactoriza tipos, Persona B usa hooks | Persona A debe completar A5 antes de que Persona B empiece B20. Orden: A5 → B20.                                                                            |

## Recomendaciones para evitar bloqueos

1. **Semana 1-2**: Persona A completa A5 (tipos genéricos), A6 (tipos duplicados), A4 (dedup módulos). Persona B completa B1-B9 (bugs y toasts en páginas, sin depender de nuevos tipos).
2. **Semana 2-3**: Persona A completa A1-A3, A7-A18. Persona B aplica B20 (reemplazar `as Record`) usando los nuevos tipos de A5.
3. **Semana 3-4**: Persona A finaliza documentación y cleanup. Persona B completa B10-B22 (componentes nuevos, UI avanzada, responsive).
4. Usar branches separadas: `fix/infrastructure` y `fix/features-ui`. Merge de `fix/infrastructure` va primero.
5. Si una tarea de Persona B requiere un tipo que Persona A aún no creó, usar el tipo existente y crear un TODO para actualizar después.

---

# Problemas Técnicos Detectados

## Bugs Potenciales

| #   | Bug                                                                   | Ubicación                                             | Impacto                                              |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| 1   | `useServerTime()` nunca llamado → clock header no muestra hora real   | `shared/hooks/useServerTime.ts`, `AppShell.tsx:156`   | Funcionalidad no operativa                           |
| 2   | Raza condition en 401 handler — segundo 401 en 2s ignorado            | `axiosInstance.ts:31-47`                              | Usuario se queda en página con requests fallidos     |
| 3   | JWT decoding sin try-catch                                            | `auth.service.ts:12`                                  | Crash en login con token malformado                  |
| 4   | `FileInput` sobreescribe `identification_code` con data URL           | `PersonCreatePage.tsx:310-314`                        | Corrupción de datos                                  |
| 5   | `requested_by: 0` hardcodeado                                         | `TransfersPage.tsx:149`                               | Transferencias inválidas (backend requiere positivo) |
| 6   | `RationsPage` — selectores vacíos por mal acceso a paginated response | `RationsPage.tsx:42-46`                               | Funcionalidad rota                                   |
| 7   | Filtrado client-side rompe paginación en PeopleListPage               | `PeopleListPage.tsx`                                  | Resultados de búsqueda incorrectos                   |
| 8   | `identification_code` sobreescrito por segundo `FileInput`            | `PersonCreatePage.tsx:310-314`                        | Campo incorrecto recibe imagen en base64             |
| 9   | `Date.now()` para business logic (4+ ubicaciones)                     | `PersonCreatePage`, `PersonDetailPage`, `RationsPage` | Fechas inconsistentes con servidor                   |
| 10  | `campId` NaN si URL param no es numérico                              | `CampDetailPage.tsx:29,80`                            | UI muestra "CAMP.NaN"                                |
| 11  | `use-mobile.tsx:14` — eslint-disable sin justificación                | `src/hooks/use-mobile.tsx`                            | Posible infinite loop sin detectar                   |
| 12  | `NavigationBinder` puede perder ref en StrictMode                     | `AppRoutes.tsx:89-100`                                | 401 redirect falla si el componente se desmonta      |
| 13  | `_hasHydrated` seteado por mutación directa                           | `auth.store.ts:64-68`                                 | Posible stale state en mismo tick                    |

## Problemas de Rendimiento

| #   | Problema                                        | Ubicación               | Impacto                                     |
| --- | ----------------------------------------------- | ----------------------- | ------------------------------------------- |
| 1   | `queryClient.invalidateQueries()` sin filtro    | `AppShell.tsx:35`       | Refetch masivo en cada cambio de campamento |
| 2   | Event listeners en cada keystroke/mouse move    | `auth-context.tsx:24`   | Actualizaciones de store excesivas          |
| 3   | `staleTime: 30_000` agresivo                    | `queryClient.ts:6`      | Refetch cada 30s incluso con datos frescos  |
| 4   | `ReactQueryDevtools` en bundle producción       | `App.tsx:28`            | Bundle size innecesario                     |
| 5   | 600ms artificial delay                          | `App.tsx:14`            | Experiencia de carga lenta forzada          |
| 6   | Google Fonts `@import` bloqueante               | `globals.css:1`         | Blocking CSS resource                       |
| 7   | RationsPage — fetch 200 people solo para select | `RationsPage.tsx:36-38` | Transferencia de datos innecesaria          |

## Problemas de Seguridad

| #   | Problema                                               | Ubicación                  | Riesgo                                        |
| --- | ------------------------------------------------------ | -------------------------- | --------------------------------------------- |
| 1   | `logger.error` siempre imprime en producción           | `logger.ts:14-16`          | Leak de tokens JWT, datos de API              |
| 2   | `lastActivity` no persistido                           | `auth.store.ts:59-63`      | Bypass de session timeout recargando          |
| 3   | Sin verificación de `/_hasHydrated` antes de servir UI | `auth.store.ts`, `App.tsx` | UI renderiza antes de hidratar auth           |
| 4   | `canAccess` retorna false para rutas no definidas      | `roleGuards.ts:43-55`      | Nuevas rutas bloqueadas por defecto sin aviso |
| 5   | Session timeout usa `Date.now()` (client clock)        | `auth-context.tsx:28`      | Bypass cambiando reloj del sistema            |
| 6   | Sin Content-Security-Policy                            | `index.html`               | Sin protección XSS                            |

## Problemas de Accesibilidad

| #   | Problema                               | Ubicación                     |
| --- | -------------------------------------- | ----------------------------- |
| 1   | Sidebar no colapsa en mobile           | `AppShell.tsx`                |
| 2   | Sin focus management en diálogos       | Varias páginas                |
| 3   | Sin aria-labels en íconos interactivos | `Sidebar.tsx`, `AppShell.tsx` |
| 4   | `prompt()` nativo no accesible         | `TransfersPage.tsx:172`       |
| 5   | Sin skip-to-content link               | `AppShell.tsx`                |

## Problemas de Arquitectura

| #   | Problema                                 | Detalle                                                                    |
| --- | ---------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Violación AGENTS.md: API data en Zustand | `camp.store.ts` almacena `serverTime` (dato de API)                        |
| 2   | Doble source of truth para auth          | Context (`auth-context.tsx`) y Zustand (`auth.store.ts`) — pueden divergir |
| 3   | Duplicación de módulos API               | `resources.api.ts` x2, `professions.api.ts` x2                             |
| 4   | `useServerTime` duplicado                | Una implementación en `shared/hooks/` y otra en `features/system/hooks/`   |
| 5   | Tipos duplicados                         | `CampStatus` x2, `PersonStatus` x3                                         |
| 6   | Respuesta API inconsistente              | Algunas retornan `res.data`, otras `res.data.data`                         |
| 7   | Sin `PaginatedResponse<T>` genérico      | Cada página hace casting manual                                            |
| 8   | Sin ErrorBoundary a nivel app            | Crash en lazy-load no manejado                                             |

## Malas Prácticas Detectadas

| #   | Práctica                                                                     | Evidencia                                 |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | `as Record<string, unknown>` en 15+ archivos                                 | Contradice TypeScript strict de AGENTS.md |
| 2   | `prompt()` nativo del navegador                                              | `TransfersPage.tsx:172`                   |
| 3   | Índice de array como fallback de React key                                   | 3+ archivos                               |
| 4   | `err.message.toLowerCase().includes('409')` en vez de `err.response?.status` | `PersonDetailPage.tsx:201-202`            |
| 5   | Validación con `setError` en vez de zod en form                              | `ExplorationsPage.tsx:167-168,172-173`    |
| 6   | Mutación de form values con `delete payload.password`                        | `UsersPage.tsx:129-130`                   |
| 7   | `NavigationBinder` — side-effect-only component renderizando `null`          | `AppRoutes.tsx:89-100`                    |
| 8   | Mix de `zodResolver` directo y wrapper `resolved`                            | `ExplorationsPage.tsx`, `LoginPage.tsx`   |
| 9   | `_hasHydrated` por mutación directa, no por `set()`                          | `auth.store.ts:64-68`                     |
| 10  | `eslint-disable-next-line` sin comentario justificativo                      | `use-mobile.tsx:14`                       |

---

# Recomendaciones

## Refactors Sugeridos

1. **Extraer `useStats` de `DashboardPage`** → nuevo hook `useDashboardStats.ts`
2. **Unificar enfoque de time sync** → eliminar implementación con Zustand, usar solo TanStack Query
3. **Separar `login` de `logout` en auth service** — `logout` no necesita ser async
4. **Renombrar variantes de `StatusBadge`** para que coincidan con colores reales
5. **Crear hook `useCampId`** para evitar repetir `Number(id)` + validación en cada página de detalle

## Mejoras de Estructura

1. **Agregar directorio `src/components/` para ErrorBoundary** (no existe actualmente un lugar canónico para componentes de infraestructura)
2. **Feature `rations/`** necesita `api/` y `hooks/` como los demás módulos
3. **Extraer `PersonStatus` a tipo compartido** — lo usan 3 features distintas
4. **Centralizar permisos de rol** en un solo archivo, no dispersos entre `roleGuards.ts`, `useNavItems.ts`, y `auth.service.ts`

## Optimizaciones Posibles

1. Aumentar `staleTime` de 30s a 5min para queries estables (camps, professions, resources)
2. Usar `placeholderData: (prev) => prev` en paginación para evitar flashes de loading
3. Agregar `enabled` condicional a queries que dependen de selección de campamento
4. Implementar `React.lazy` también para componentes pesados (charts, modales con formularios)

## Buenas Prácticas Faltantes

1. Tests automatizados (Playwright E2E + Vitest unit)
2. CI/CD pipeline (GitHub Actions: lint, spell, build, test en cada PR)
3. Content-Security-Policy headers
4. `skip-to-content` link para accesibilidad
5. Loading skeletons consistentes en todas las páginas
6. Manejo de estado vacío (empty states) en todas las listas/tablas
7. Error boundaries por sección, no solo a nivel app

---

# Plan Sugerido

## 1. Crítico (Semana 1)

| Orden | Tarea                                                             | Persona | Dependencias |
| ----- | ----------------------------------------------------------------- | ------- | ------------ |
| 1     | A5 — Crear `PaginatedResponse<T>` y tipar API functions           | A       | —            |
| 2     | A6 — Unificar tipos duplicados (`CampStatus`, `PersonStatus`)     | A       | —            |
| 3     | A4 — Consolidar módulos API duplicados                            | A       | A5, A6       |
| 4     | A1 — Arreglar sincronización del tiempo del servidor (serverTime) | A       | —            |
| 5     | A2 — Corregir raza condition del 401 handler                      | A       | —            |
| 6     | A3 — JWT decoding con try-catch + usar tipo Role                  | A       | —            |
| 7     | B1 + B2 — Agregar toasts + try-catch en mutaciones                | B       | —            |
| 8     | B3 — `requested_by: 0` hardcodeado                                | B       | —            |
| 9     | B4 — `FileInput` sobreescribe `identification_code`               | B       | —            |
| 10    | B5 — Reemplazar `prompt()` nativo                                 | B       | —            |
| 11    | B6 — Arreglar AlertDialog sticky en ExplorationsPage              | B       | —            |
| 12    | B8 — Arrays vacíos en RationsPage                                 | B       | A5           |

## 2. Importante (Semana 2)

| Orden | Tarea                                                          | Persona | Dependencias |
| ----- | -------------------------------------------------------------- | ------- | ------------ |
| 13    | B7 — Filtrado server-side en PeopleListPage                    | B       | —            |
| 14    | B9 — Parsing frágil de descripciones en RationsPage            | B       | —            |
| 15    | B15 — AI Explainability UI (admission ai_reasoning)            | B       | —            |
| 16    | A7 — Error Boundary para lazy-loaded routes                    | A       | —            |
| 17    | A8 + A9 — Debounce de event listeners + persistir lastActivity | A       | —            |
| 18    | A12 — Filtro en `queryClient.invalidateQueries()`              | A       | A5           |
| 19    | B20 — Reemplazar `as Record<string, unknown>` con tipos reales | B       | A5           |
| 20    | A13 — Centralizar permisos de rol y arreglar useNavItems       | A       | A3           |
| 21    | A16 — Logger condicional en producción                         | A       | —            |

## 3. Mejoras (Semana 3)

| Orden | Tarea                                                 | Persona | Dependencias |
| ----- | ----------------------------------------------------- | ------- | ------------ |
| 22    | A10 — Limpiar archivos vacíos y dead code             | A       | —            |
| 23    | A11 — Clases CSS vacías en globals.css                | A       | —            |
| 24    | A17 — Estandarizar `zodResolver` → wrapper `resolved` | A       | —            |
| 25    | B10 — Confirmación en acciones destructivas           | B       | —            |
| 26    | B12 — Status "DECEASED" vs "DEAD"                     | B       | —            |
| 27    | B13 — Reemplazar `Date.now()` por server time         | B       | A1           |
| 28    | B16 — Renombrar variantes StatusBadge                 | B       | —            |
| 29    | B17 — Expandir tipo accent en Panel                   | B       | —            |
| 30    | B18 — Validar campId en CampDetailPage                | B       | —            |
| 31    | B19 — Arreglar React key con fallback de índice       | B       | —            |
| 32    | B21 — Extraer useStats a hook separado                | B       | —            |

## 4. Optimización Final (Semana 4)

| Orden | Tarea                                                            | Persona | Dependencias |
| ----- | ---------------------------------------------------------------- | ------- | ------------ |
| 33    | A14 — `ReactQueryDevtools` solo en DEV                           | A       | —            |
| 34    | A15 — Eliminar delay 600ms en App.tsx                            | A       | —            |
| 35    | A18 — Actualizar documentación obsoleta                          | A       | —            |
| 36    | B14 — Remover/reemplazar placeholder notices en ExplorationsPage | B       | B15          |
| 37    | B22 — Responsive layout con drawer mobile                        | B       | —            |
| 38    | — Crear tests E2E con Playwright (6 escenarios de MILESTONES.md) | A o B   | —            |
| 39    | — Configurar CI/CD con GitHub Actions                            | A       | —            |
| 40    | — Actualizar `README.md` con instrucciones de setup              | A       | —            |

---

> **Total de tareas**: 40
> **Persona A**: 20 tareas | **Persona B**: 20 tareas
> **Archivos solapados**: 2 (`AppShell.tsx`, `LoginPage.tsx`) con áreas no conflictivas
> **Tareas bloqueantes**: A5 y A1 deben completarse antes de que B inicie B20 y B13 respectivamente
