# Tareas Pendientes — Gestión del Fin (Frontend)

> Análisis exhaustivo del estado actual del proyecto · 2026-05-19

---

# Estado General del Proyecto

## Resumen

El frontend de **Gestión del Fin** está funcional en su núcleo CRUD (campamentos, personas, inventario, recursos, usuarios, transferencias, exploraciones). La aplicación usa React 19, TypeScript estricto, Vite 8, Tailwind 3, TanStack Query 5, Zustand 5 y shadcn/ui con una estética brutalist dark.

**Cumplimiento estimado de requerimientos:** ~65%. De 10 funcionales y 7 no funcionales, 5 RF están completos, 3 están parciales y 2 completamente ausentes. En RNF: 2 completos, 3 parciales y 2 ausentes.

## Problemas Críticos Detectados

1. **Bypass del bloqueo de sesión al recargar la página** — `isLocked` y `lastActivity` no se persisten en `localStorage`. Al refrescar, la sesión se desbloquea aunque hubiera expirado.
2. **TransfersPage envía `requested_by: 0` hardcodeado** — todos los transfers creados desde el frontend tienen autor inválido.
3. **Sin ErrorBoundary** — cualquier error no manejado en un componente crashea toda la app (pantalla blanca).
4. **No hay tests de ningún tipo** — ni unitarios, ni integración, ni E2E (Playwright requerido por RNF-05).
5. **Integración IA completamente ausente** — RF-04/RF-05 requieren evaluación IA de admisiones con explicabilidad; solo existe un campo de texto `ai_context_prompt`.

## Funcionalidades Incompletas

| RF     | Descripción                   | Estado                                        |
| ------ | ----------------------------- | --------------------------------------------- |
| 01     | Auth y sesión                 | ⚠️ Bug de bypass al refrescar                 |
| 03     | Dashboard por rol             | ⚠️ Worker y travel_coordinator sin métricas   |
| 04     | Ingreso de personas con IA    | ❌ Solo campo de prompt, sin IA real          |
| 05     | Estado y trabajo de personas  | ⚠️ Falta UI de subida de imágenes             |
| 06     | Bodega y recursos             | ⚠️ Procesamiento automático diario no visible |
| 07     | Exploraciones                 | ⚠️ Provisioning de recursos es placeholder    |
| 09     | Solicitudes entre campamentos | ⚠️ `requested_by: 0` hardcodeado              |
| RNF-03 | UX/Gamificación               | ❌ Sin elementos de gamificación              |
| RNF-04 | Rendimiento                   | ⚠️ Sin paginación en exploraciones            |
| RNF-05 | Playwright E2E                | ❌ Cero tests                                 |
| RNF-06 | Deploy Vercel                 | ⚠️ Sin configuración de Vercel                |
| RNF-07 | IA explicabilidad             | ❌ Sin UI de explicabilidad                   |

## Riesgos Técnicos

- **TypeScript debilitado por 20 archivos con `Record<string, unknown>`** — cambios en el backend rompen el frontend silenciosamente.
- **73 archivos huérfanos en `temp/neon-nova-dashboard/`** (~5400 líneas) — riesgo de confusión para nuevos desarrolladores.
- **Sin tests** — cada cambio se despliega sin verificación. Refactorizar las 3 páginas gigantes (740-830 líneas) es peligroso.
- **Rutas lazy sin ErrorBoundary** — fallo de carga de chunk = pantalla blanca.
- **Zustand guarda `serverTime` violando regla de arquitectura** — debe estar en TanStack Query.

---

# División de Responsabilidades

> Las tareas están divididas en dos grupos que minimizan conflictos de merge y dependencias cruzadas. **Persona A** se enfoca en infraestructura, tipos, seguridad y tooling. **Persona B** se enfoca en features, UI/UX y requerimientos funcionales.

---

## Persona A — Infraestructura, Tipos, Seguridad y Tooling

### A1. Agregar ErrorBoundary global

**Archivos:** `src/components/cyber/ErrorBoundary.tsx` (nuevo), `src/routes/AppRoutes.tsx`
**Prioridad:** Alta
**Dependencias:** Ninguna
**Complejidad:** Baja
**Descripción:** Crear componente `ErrorBoundary` con React `componentDidCatch` o `useErrorBoundary`. Envolver `<Suspense>` en `AppRoutes.tsx` con el ErrorBoundary. Mostrar fallback con botón de reintentar. Esto previene el crash total ante fallos de lazy loading.

### A2. Eliminar scaffolding huérfano `temp/`

**Archivos:** `temp/neon-nova-dashboard/**` (73 archivos, ~5400 líneas)
**Prioridad:** Alta
**Dependencias:** Verificar que nada en `src/` importa de `temp/` (ya confirmado: 0 imports)
**Complejidad:** Baja
**Descripción:** Eliminar directorio `temp/` completo. Es un sub-proyecto de scaffolding que no se usa. Confunde búsquedas, duplica componentes, y podría interferir con tooling.

### A3. Eliminar componentes legacy de navegación

**Archivos:** `src/components/navigation/DockBar.tsx`, `Navbar.tsx`, `Sidebar.tsx`
**Prioridad:** Media
**Dependencias:** Verificar 0 imports (ya confirmado)
**Complejidad:** Baja
**Descripción:** Los 3 archivos en `src/components/navigation/` son código muerto reemplazado por `AppShell`. Eliminarlos reduce el bundle y evita confusión.

### A4. Consolidar `resources.api.ts` duplicado

**Archivos:** `src/features/inventory/api/resources.api.ts`, `src/features/resources/api/resources.api.ts`
**Prioridad:** Alta
**Dependencias:** Verificar imports de inventory hacia el módulo duplicado
**Complejidad:** Baja
**Descripción:** Ambos archivos son idénticos byte-por-byte. Eliminar `src/features/inventory/api/resources.api.ts`. Actualizar los imports en `src/features/inventory/` para que usen `@/features/resources/api/resources.api`. El módulo canónico es `resources`.

### A5. Unificar uso de `zodResolver`

**Archivos:** `src/shared/lib/form.ts`, `src/pages/LoginPage.tsx`, `src/features/explorations/pages/ExplorationsPage.tsx`
**Prioridad:** Baja
**Dependencias:** A4 (toca mismos archivos de inventory)
**Complejidad:** Baja
**Descripción:** `src/shared/lib/form.ts` re-exporta `zodResolver` con type cast innecesario. Algunos archivos usan `zodResolver` directamente. Estandarizar a `zodResolver` directo, eliminar el archivo `form.ts`. Actualizar todos los forms (10+ páginas).

### A6. Mover `serverTime` de Zustand a TanStack Query

**Archivos:** `src/features/camps/store/camp.store.ts`, `src/shared/hooks/useServerTime.ts`
**Prioridad:** Alta
**Dependencias:** Ninguna
**Complejidad:** Media
**Descripción:** Violación de regla de arquitectura: `campStore` almacena `serverTime` (dato de API) en Zustand. Mover a TanStack Query: crear hook `useServerTime()` con `useQuery`, `staleTime: 60_000`. Eliminar `serverTime`, `lastSyncLocal` y `syncServerTime` de Zustand.

### A7. Corregir bypass de bloqueo de sesión

**Archivos:** `src/features/auth/store/auth.store.ts`
**Prioridad:** Alta
**Dependencias:** Ninguna
**Complejidad:** Media
**Descripción:** `partialize` solo persiste `user`, `token`, `role`. Agregar `isLocked` y `lastActivity` a la persistencia. Alternativa más segura: guardar `lastActivity` como timestamp de última acción y recalcular `isLocked` en `onRehydrateStorage` comparando con `Date.now()`. Esto cierra el bypass de sesión expirada al refrescar la página.

### A8. Definir tipos de respuesta de API (`PaginatedResponse<T>`, `ApiResponse<T>`)

**Archivos:** `src/shared/api/types.ts` (modificar), 20 archivos con `Record<string, unknown>`
**Prioridad:** Media
**Dependencias:** Bloquea parcialmente B3, B4, B9
**Complejidad:** Alta
**Descripción:** Crear genéricos `PaginatedResponse<T>` y `ApiResponse<T>` en `types.ts`. Propagar a través de todos los módulos API y hooks. Reemplazar casts `as Record<string, unknown>` con tipos concretos. Esto es el trabajo de mayor esfuerzo pero es fundacional para type safety.
**Nota:** Esta tarea debe hacerse en coordinación con Persona B. Empezar por los tipos compartidos, luego cada persona actualiza las features que le corresponden.

### A9. Agregar configuración de Vercel

**Archivos:** `vercel.json` (nuevo)
**Prioridad:** Media
**Dependencias:** Ninguna
**Complejidad:** Baja
**Descripción:** Crear `vercel.json` con configuración de build (framework: vite), rewrites del proxy API, y SPA fallback. Requerido por RNF-06.

### A10. Agregar sanitización de inputs de usuario

**Archivos:** `src/components/ui/chart.tsx`, `src/components/cyber/FileInput.tsx`
**Prioridad:** Media
**Dependencias:** Ninguna
**Complejidad:** Baja
**Descripción:** Agregar `dompurify` como dependencia. Auditar `chart.tsx:89` que usa `dangerouslySetInnerHTML` para tooltips SVG y sanitizar. Optimizar `FileInput.tsx` con resize de canvas antes de base64.

### A11. Corregir invalidación de queries al cambiar de campamento

**Archivos:** `src/layouts/AppShell.tsx`
**Prioridad:** Media
**Dependencias:** Ninguna
**Complejidad:** Baja
**Descripción:** `queryClient.invalidateQueries()` sin filtro (línea 35) invalida TODAS las queries. Usar predicado para solo invalidar queries con scope de campamento: excluir `['system-time']`, `['professions']`, `['camps']`, `['users']`.

---

## Persona B — Features, UI/UX y Requerimientos Funcionales

### B1. Implementar evaluación IA de admisiones (RF-04)

**Archivos:** `src/features/admission/pages/AdmissionsPage.tsx` (modificar), `src/features/admission/components/AiEvaluationPanel.tsx` (nuevo), `src/features/admission/types/` (nuevo)
**Prioridad:** Alta
**Dependencias:** Backend debe exponer endpoint de evaluación IA
**Complejidad:** Alta
**Descripción:** El campo `ai_context_prompt` existe pero no hay IA real. Implementar flujo: enviar datos de persona + prompt → endpoint IA → recibir decisión con criterios → mostrar en panel explicable. La UI debe mostrar los criterios usados por la IA de forma transparente. El usuario puede revisar, aceptar o corregir la decisión (generar reporte de aceptación/rechazo). Al aceptar, asignar ID y cargo/profesión automáticamente.

### B2. UI de explicabilidad IA (RNF-07)

**Archivos:** `src/features/admission/components/AiExplainabilityPanel.tsx` (nuevo)
**Prioridad:** Alta
**Dependencias:** B1
**Complejidad:** Media
**Descripción:** Panel que muestra de forma transparente: criterios evaluados, puntaje por criterio, decisión final, nivel de confianza. Elemento visual que permita al usuario entender por qué la IA tomó esa decisión. Integrar flujo de revisión/aceptación/corrección.

### B3. Corregir `requested_by: 0` en TransfersPage

**Archivos:** `src/features/transfers/pages/TransfersPage.tsx`
**Prioridad:** Alta
**Dependencias:** A8 (tipos de API)
**Complejidad:** Baja
**Descripción:** Línea 148 hardcodea `requested_by: 0`. La página ya tiene acceso a `useAuthStore()`. Reemplazar con `userId` del store de autenticación.

### B4. Implementar provisioning de recursos en exploraciones (RF-07)

**Archivos:** `src/features/explorations/pages/ExplorationsPage.tsx`
**Prioridad:** Alta
**Dependencias:** A8 (tipos de API), B3 (mismo patrón de mutation)
**Complejidad:** Media
**Descripción:** El placeholder "Resource allocation pending inventory integration" (líneas 577-583) debe reemplazarse con UI funcional. `CreateExplorationDto` ya soporta `allocated_resources`. Agregar selector de recursos con cantidades al crear/editar exploración. Validar disponibilidad de stock. Conectar return flow para contabilizar provisiones traídas automáticamente.

### B5. Dashboard con métricas específicas por rol (RF-03)

**Archivos:** `src/pages/DashboardPage.tsx`
**Prioridad:** Alta
**Dependencias:** Ninguna
**Complejidad:** Media
**Descripción:** Worker role actualmente solo ve cards de navegación ("INVENTORY", "RATIONS"). Agregar métricas reales: recursos a su cargo, tareas pendientes, últimos ajustes de inventario. Travel_coordinator solo ve "EXPEDITIONS" sin métricas — agregar exploraciones activas, próximas salidas, recursos asignados.

### B6. Agregar paginación a exploraciones

**Archivos:** `src/features/explorations/api/explorations.api.ts`, `src/features/explorations/pages/ExplorationsPage.tsx`
**Prioridad:** Media
**Dependencias:** A8 (PaginationQuery genérico)
**Complejidad:** Baja
**Descripción:** `getAll()` en `explorations.api.ts` no acepta parámetros de paginación. Agregar `PaginationQuery` y propagar a hook y página. Requerido por RNF-04.

### B7. Corregir filtrado client-side en lista de personas

**Archivos:** `src/features/people/pages/PeopleListPage.tsx`
**Prioridad:** Media
**Dependencias:** A8 (tipos de API)
**Complejidad:** Media
**Descripción:** La página fetchea 20 registros pero filtra client-side con `searchTerm`, `statusFilter`, `professionFilter`. Resultado: si el match está en página 3, página 1 muestra 0 resultados. Mover filtros al API (agregar `search`, `status`, `profession_id` a `PaginationQuery`).

### B8. Implementar gamificación (RNF-03)

**Archivos:** `src/components/cyber/GamificationPanel.tsx` (nuevo), `src/features/gamification/` (nuevo), `src/layouts/AppShell.tsx` (integrar)
**Prioridad:** Baja
**Dependencias:** Ninguna
**Complejidad:** Alta
**Descripción:** Crear sistema de gamificación con temática zombie: niveles de campamento, logros por hitos (primer transfer, 100 recursos, expedición exitosa), racha de días sin incidentes, score de eficiencia. Integrar sutilmente en dashboard/sidebar sin romper la estética brutalist. Usar store Zustand local + posible API para persistencia.

### B9. Refactorizar páginas grandes en componentes

**Archivos:** `src/features/explorations/pages/ExplorationsPage.tsx` (830 líneas), `src/features/transfers/pages/TransfersPage.tsx` (741 líneas), `src/features/people/pages/PersonDetailPage.tsx` (740 líneas)
**Prioridad:** Baja
**Dependencias:** A8 (tipos), B3, B4 (estas tareas ya tocan estos archivos)
**Complejidad:** Alta
**Descripción:** Cada "god component" mezcla fetching, forms, dialogs, y renderizado. Extraer: dialogs a componentes separados en `components/`, lógica de forms a hooks custom, sub-secciones de detalle a componentes dedicados. Beneficio: habilita code splitting, mejora testabilidad.

### B10. Agregar layout responsive para móvil

**Archivos:** `src/layouts/AppShell.tsx`, `src/hooks/use-mobile.tsx`
**Prioridad:** Media
**Dependencias:** Ninguna
**Complejidad:** Media
**Descripción:** `use-mobile.tsx` existe pero AppShell no lo usa. Implementar: sidebar colapsa a drawer/offcanvas en móvil, header sticky compacto, tablas con scroll horizontal. Las cards del dashboard deben apilarse verticalmente.

### B11. Subida de imágenes para personas (RF-04)

**Archivos:** `src/features/people/pages/PersonCreatePage.tsx`, `src/components/cyber/FileInput.tsx`
**Prioridad:** Media
**Dependencias:** A10 (optimización de imágenes)
**Complejidad:** Media
**Descripción:** Los DTOs `CreatePersonDto` tienen campos `photo_url` e `id_card_url` pero la UI de subida es mínima. Mejorar `FileInput` con preview, compresión (canvas resize), y carga al servidor. Agregar vista de tarjeta de identificación en `PersonDetailPage.tsx`.

### B12. Mostrar procesamiento automático diario de bodega (RF-06)

**Archivos:** `src/features/inventory/pages/InventoryPage.tsx`, `src/features/rations/pages/RationsPage.tsx`
**Prioridad:** Baja
**Dependencias:** Ninguna
**Complejidad:** Media
**Descripción:** Agregar indicadores visuales de: ingreso diario de comida/agua por trabajador, consumo diario de raciones por persona, resumen del último procesamiento automático. La lógica de backend ya existe (campo `auto_daily` en recursos). La UI debe reflejar cambios automáticos y permitir override manual.

---

# Tareas Compartidas o de Coordinación

## Sincronización necesaria

1. **Tipos de API (`A8`)** — Persona A define `PaginatedResponse<T>` y `ApiResponse<T>`. Ambas personas deben actualizar sus features asignadas para usar los nuevos tipos. Hacer esto después de A8 y antes de B3/B4/B7/B9.

2. **Estructura de features** — Persona A toca `src/features/inventory/` (A4) y `src/features/camps/` (A6). Persona B toca `src/features/transfers/` (B3), `src/features/explorations/` (B4, B6), `src/features/admission/` (B1, B2). No hay solapamiento de archivos excepto en tipos compartidos.

3. **Playwright E2E tests (RNF-05)** — **Tarea post-implementación.** Una vez que ambas personas completen features críticas, escribir tests E2E con Playwright cubriendo: login/logout, flujo de admisión con IA, transfer entre campamentos, ciclo de exploración, cambio de campamento.

## Posibles conflictos entre ramas

| Riesgo                                         | Probabilidad | Mitigación                                                                            |
| ---------------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `src/shared/api/types.ts` editado por ambos    | Media        | Persona A hace A8 primero, merge a main, ambos rebasean                               |
| `src/layouts/AppShell.tsx` (A11 y B10)         | Media        | A11 es cambio de 1 línea; hacer A11 primero, luego B10                                |
| `src/features/inventory/api/` eliminado por A4 | Baja         | A4 solo elimina `resources.api.ts` duplicado; inventory mantiene sus propios archivos |
| `src/shared/lib/form.ts` eliminado en A5       | Media        | A5 es último en la cola de A; comunicar antes de merge                                |
| Barrel exports en `index.ts`                   | Baja         | Cada persona toca features distintas                                                  |

## Orden recomendado de implementación

```
Fase 1 (Crítico):  A1  A7  A2  B3
                   └───┴───┴───┘ (paralelo, sin conflictos)

Fase 2 (Tipos):    A8  [SINCRONIZAR]
                   └── Persona A termina A8, ambas personas rebasean

Fase 3 (Features): A4  A6  A11  │  B1  B4  B5  B2
                   └────┴────┴───┴──┴───┴───┴──┘ (paralelo)

Fase 4 (Mejoras):  A3  A5  A9  A10  │  B6  B7  B10  B11  B12
                   └───┴───┴───┴────┴───┴───┴────┴────┴───┘ (paralelo)

Fase 5 (Refactor): B9  B8
                   └──┴── (secuencial: B9 habilita B8)

Fase 6 (QA):       Playwright E2E tests
                   └── Ambas personas colaboran
```

---

# Problemas Técnicos Detectados

## Bugs Potenciales

| Bug                                                                                        | Archivo                                              | Gravedad    |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------- |
| Bloqueo de sesión se pierde al refrescar (`isLocked`/`lastActivity` no persistidos)        | `src/features/auth/store/auth.store.ts:59-63`        | **Crítico** |
| `requested_by: 0` hardcodeado en creación de transfers                                     | `src/features/transfers/pages/TransfersPage.tsx:148` | **Alto**    |
| `useAuth()` crashea la app si se llama fuera de `AuthProvider` (sin ErrorBoundary)         | `src/features/auth/useAuth.ts:8`                     | **Alto**    |
| `navigationRef` race condition: 401 handler ignorado por 2s tras logout                    | `src/shared/api/axiosInstance.ts:24-47`              | **Medio**   |
| Filtrado client-side en PeopleListPage: busca en página 1 aunque el match esté en página 3 | `src/features/people/pages/PeopleListPage.tsx:61-72` | **Medio**   |
| `lastActivity` se reinicia a `Date.now()` en cada recarga (no usa server time)             | `src/features/auth/auth-context.tsx:28-32`           | **Medio**   |
| `userId` no se persiste en localStorage (ausente de `partialize`)                          | `src/features/auth/store/auth.store.ts:59-63`        | **Bajo**    |

## Problemas de Rendimiento

- **Exploraciones sin paginación** — `GET /expeditions` fetchea todos los registros (`src/features/explorations/api/explorations.api.ts:47`)
- **Camp switch invalida TODAS las queries** — `queryClient.invalidateQueries()` sin filtro causa refetch waterfall (`src/layouts/AppShell.tsx:35`)
- **Imágenes en base64 sin compresión** — `FileInput.tsx:25-29` convierte a data URL sin resize
- **3 páginas de 740-830 líneas** — sin code splitting de contenido de diálogos, se carga todo junto

## Problemas de Seguridad

- **JWT en localStorage** — vulnerable a XSS (`src/features/auth/store/auth.store.ts:58-63`)
- **Session timeout usa `Date.now()`** — manipulable cambiando reloj del sistema (`src/features/auth/auth-context.tsx:27-32`)
- **Role guards son solo client-side** — `canAccess()` en `src/shared/lib/roleGuards.ts` puede bypassearse con devtools
- **Sin sanitización de inputs** — no se usa DOMPurify ni librería similar; `chart.tsx:89` usa `dangerouslySetInnerHTML`
- **`.env` presente en el repositorio** — verificar que solo contenga `VITE_*` vars

## Problemas de Accesibilidad

- Sin atributos `aria-label` en iconos interactivos
- Sidebar colapsable sin indicación para lectores de pantalla
- Sin focus management en diálogos (Radix debería manejarlo, verificar)
- Sin skip-to-content link
- Estados de formulario comunicados solo por color (errores en rojo sin texto descriptivo en algunos campos)

## Problemas de Arquitectura

- **`serverTime` en Zustand** — viola regla "nunca API data en Zustand" (`src/features/camps/store/camp.store.ts:6-7`)
- **`resources.api.ts` duplicado** — `inventory/api/` y `resources/api/` idénticos
- **Sin ErrorBoundary** — 17 rutas lazy sin recovery ante fallo de chunk
- **Legacy navigation components** — `Sidebar.tsx`, `Navbar.tsx`, `DockBar.tsx` son código muerto
- **73 archivos en `temp/`** — sub-proyecto huérfano con su propio `package.json`
- **Wildcard route fuera de ProtectedRoute** — `*` redirect en nivel superior sin verificación de auth (`src/routes/AppRoutes.tsx`)

## Malas Prácticas Detectadas

- `Record<string, unknown>` en 20 archivos como escape hatch de tipos
- `resolved()` wrapper innecesario en `src/shared/lib/form.ts` duplica `zodResolver`
- `as` casts en cadena para desempaquetar respuestas (ej: `(data as Record<string, unknown>)?.data as Record<string, unknown>[]`)
- Placeholder textual en vez de UI funcional ("Resource allocation pending inventory integration")
- `Date.now()` para lógica de negocio (debe usar server time)
- DTOs definidos en archivos de API en vez de `types/` (convención mixta)

---

# Recomendaciones

## Refactors Sugeridos

1. **Extraer lógica de diálogos de páginas grandes** — `ExplorationsPage.tsx` (830 líneas), `TransfersPage.tsx` (741 líneas), `PersonDetailPage.tsx` (740 líneas). Mover cada diálogo a su propio componente en `components/`.
2. **Centralizar tipos de respuesta de API** — Reemplazar `Record<string, unknown>` con `PaginatedResponse<T>` y `ApiResponse<T>` genéricos en `src/shared/api/types.ts`.
3. **Estandarizar DTOs en `types/`** — Algunas features definen DTOs en `api/*.api.ts`, otras en `types/*.types.ts`. Mover todos a `types/` para consistencia.
4. **Migrar a server time para timeout de sesión** — Reemplazar `Date.now()` en `auth-context.tsx` con `getServerNow()` de `useServerTime.ts`.

## Mejoras de Estructura

- Crear feature `gamification/` para elementos de juego (B8)
- Agregar directorio `src/features/admission/components/` (no existe) para paneles de IA (B1, B2)
- Agregar `src/features/explorations/components/` para extraer diálogos de página grande (B9)
- Eliminar `src/components/navigation/` (código muerto) (A3)
- Agregar `__tests__/` o carpeta `tests/` a nivel raíz para Playwright (post-implementación)

## Optimizaciones Posibles

- **Lazy loading de contenido de diálogos** — `React.lazy()` para modales pesados (formularios de creación)
- **Memoizar items de lista** — `React.memo` en filas de tabla con datos estables
- **Virtualizar listas largas** — Selector de campamentos con 50+ opciones
- **Preload de chunks** — `link rel="modulepreload"` para rutas frecuentes (dashboard, inventory)
- **Optimizar bundle de framer-motion** — verificar tree-shaking de `motion/react`

## Buenas Prácticas Faltantes

- **Tests** — ninguna cobertura de tests (unitarios, integración, E2E). Agregar Playwright post-features.
- **Error tracking** — sin integración con Sentry, LogRocket o similar
- **CSP headers** — sin Content-Security-Policy para mitigar XSS
- **Git hooks** — verificar si `pnpm check` corre en pre-commit (no hay `.husky/` visible)
- **Changelog** — sin registro de cambios entre versiones
- **Storybook** — sin catálogo de componentes para desarrollo aislado

---

# Plan Sugerido

## 1. Crítico (bloquea el resto)

| #   | Tarea                                       | Persona | Esfuerzo |
| --- | ------------------------------------------- | ------- | -------- |
| A1  | Agregar ErrorBoundary global                | A       | 1-2h     |
| A7  | Corregir bypass de bloqueo de sesión        | A       | 2-3h     |
| A2  | Eliminar `temp/` y navegación legacy        | A       | 30min    |
| B3  | Corregir `requested_by: 0` en TransfersPage | B       | 30min    |

**Meta:** App no crashea con pantalla blanca, sesión no se bypassea al refrescar, transfers con autor correcto, código muerto eliminado.

## 2. Importante (requerimientos funcionales clave)

| #   | Tarea                                                      | Persona | Esfuerzo |
| --- | ---------------------------------------------------------- | ------- | -------- |
| A8  | Definir tipos de respuesta de API (`PaginatedResponse<T>`) | A       | 3-4h     |
| A4  | Consolidar `resources.api.ts` duplicado                    | A       | 1h       |
| A6  | Mover `serverTime` de Zustand a TanStack Query             | A       | 1-2h     |
| B1  | Implementar evaluación IA de admisiones (RF-04)            | B       | 5-8h     |
| B4  | Implementar provisioning de exploraciones (RF-07)          | B       | 3-4h     |
| B5  | Dashboard con métricas por rol (RF-03)                     | B       | 2-3h     |
| B2  | UI de explicabilidad IA (RNF-07)                           | B       | 3-4h     |

**Meta:** RF-04, RF-07 y RF-03 funcionales. Tipos de API sólidos. Arquitectura corregida.

## 3. Mejoras (calidad, UX, rendimiento)

| #   | Tarea                                                  | Persona | Esfuerzo |
| --- | ------------------------------------------------------ | ------- | -------- |
| A11 | Corregir invalidación de queries al cambiar campamento | A       | 30min    |
| A9  | Agregar configuración de Vercel (RNF-06)               | A       | 1h       |
| A10 | Agregar sanitización de inputs                         | A       | 1-2h     |
| B6  | Agregar paginación a exploraciones                     | B       | 1h       |
| B7  | Corregir filtrado client-side en PeopleListPage        | B       | 2h       |
| B10 | Layout responsive para móvil                           | B       | 3-4h     |
| B11 | Subida de imágenes para personas (RF-04)               | B       | 2-3h     |

**Meta:** RNF-04 cumplido. RNF-06 listo. Mejor UX en móvil y filtros.

## 4. Optimización Final

| #   | Tarea                                           | Persona | Esfuerzo |
| --- | ----------------------------------------------- | ------- | -------- |
| A5  | Unificar uso de `zodResolver`                   | A       | 1-2h     |
| A3  | Eliminar componentes legacy navegación          | A       | 15min    |
| B12 | Mostrar procesamiento automático diario (RF-06) | B       | 2-3h     |
| B9  | Refactorizar páginas grandes                    | B       | 5-8h     |
| B8  | Implementar gamificación (RNF-03)               | B       | 5-8h     |
| —   | Playwright E2E tests (RNF-05)                   | A+B     | 8-12h    |

**Meta:** Código limpio, gamificación integrada, tests E2E cubriendo flujos críticos.

---

> **Estimación total:** ~55-80 horas de trabajo entre dos personas.
>
> **Prioridad máxima:** A1, A7, B3 (bugs que rompen funcionalidad) → A8, B1, B2 (features core requeridas) → Playwright E2E (requisito evaluable).
