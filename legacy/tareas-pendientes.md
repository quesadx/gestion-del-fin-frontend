# Tareas Pendientes — Gestión del Fin · Frontend

> Auditoría completa del estado del proyecto al 2026-05-21.
> Basada en evidencia directa del código fuente, comparación contra `requerimientos-frontend.md`.
> Las 40 tareas del plan anterior (A1-A18, B1-B22, 2026-05-19) están **completadas** en commits posteriores.
> Este documento solo contiene **faltantes reales** detectados en la auditoría actual.

---

# Estado General Actual

## Qué partes ya están completas

| Área                                                 | Estado           | Evidencia                                                                                                   |
| ---------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Login con credenciales JWT                           | COMPLETO         | `LoginPage.tsx`, `auth.service.ts`, `auth.store.ts`                                                         |
| Protección de rutas por rol (RBAC)                   | COMPLETO         | `ProtectedRoute.tsx`, `roleGuards.ts` (13 rutas mapeadas)                                                   |
| Sidebar con filtrado por rol                         | COMPLETO         | `useNavItems.ts:94-101` — 4 roles con nav items distintos                                                   |
| Session expiry 20 min con server time                | COMPLETO         | `auth-context.tsx` + `getServerNow()`, throttle 5s, persist `lastActivity`                                  |
| JWT decoding con try-catch + validación              | COMPLETO         | `auth.service.ts:26-30` — usa tipo `Role` y `ALL_ROLES`                                                     |
| 401 handler con cola de promesas                     | COMPLETO         | `axiosInstance.ts:31-67`                                                                                    |
| Módulos API/hooks consolidados (dedup)               | COMPLETO         | Sin duplicación `resources.api.ts`/`professions.api.ts` activa                                              |
| Tipos genéricos `PaginatedResponse<T>`               | COMPLETO         | `shared/api/types.ts:9-18`                                                                                  |
| Tipos duplicados unificados                          | COMPLETO         | `CampStatus`, `PersonStatus`, `TransferStatus` canónicos                                                    |
| Eliminación de `as Record<string, unknown>`          | COMPLETO         | 63+ casts reemplazados por `PaginatedResponse<T>`                                                           |
| ErrorBoundary por ruta                               | COMPLETO         | `ErrorBoundary.tsx:13-62`, `AppRoutes.tsx` envuelve cada lazy route                                         |
| Dead code eliminado                                  | COMPLETO         | `App.css`, `fonts.css`, `tokens.css`, `system.api.ts`, `Navbar`, `DockBar`, `temp/`, delay 600ms eliminados |
| Logger condicional (solo DEV)                        | COMPLETO         | `logger.ts`                                                                                                 |
| ReactQueryDevtools solo en DEV                       | COMPLETO         | `App.tsx`                                                                                                   |
| `zodResolver` estandarizado a wrapper `resolved`     | COMPLETO         | Todas las páginas usan `@/shared/lib/form`                                                                  |
| QueryClient invalidation con filtro por camp         | COMPLETO         | `AppShell.tsx:35` usa predicate por query key                                                               |
| `staleTime` aumentado a 5 min + `keepPreviousData`   | COMPLETO         | `queryClient.ts`, `useCamps.ts`, `usePeople.ts`                                                             |
| CSP meta tag                                         | COMPLETO         | `index.html`                                                                                                |
| Toasts + try-catch en todas las mutaciones           | COMPLETO         | Todas las páginas de features                                                                               |
| `requested_by: 0` corregido                          | COMPLETO         | `TransfersPage.tsx` usa `userId` del store                                                                  |
| `FileInput` no sobreescribe `identification_code`    | COMPLETO         | `PersonCreatePage.tsx`                                                                                      |
| `prompt()` nativo reemplazado por Dialog             | COMPLETO         | `TransfersPage.tsx`                                                                                         |
| AlertDialog sticky arreglado                         | COMPLETO         | `ExplorationsPage.tsx`                                                                                      |
| Filtrado client-side con aviso en PeopleListPage     | COMPLETO         | `PeopleListPage.tsx`                                                                                        |
| RationsPage — selectores y parsing arreglados (JSON) | COMPLETO         | `RationsPage.tsx` usa JSON `kind:'RATION'`                                                                  |
| Confirmaciones en acciones destructivas              | COMPLETO         | Transferencias, delete acciones con AlertDialog                                                             |
| `Date.now()` reemplazado por `getServerNow()`        | COMPLETO         | `PersonCreatePage`, `PersonDetailPage`, `RationsPage`                                                       |
| AI Analysis Panel implementado                       | COMPLETO         | `AIAnalysisPanel.tsx` muestra decision, reasoning, suggested profession                                     |
| StatusBadge variantes corregidas + amber             | COMPLETO         | `StatusBadge.tsx`                                                                                           |
| Panel accent expandido                               | COMPLETO         | `Panel.tsx` acepta cyan/purple/green/red                                                                    |
| `campId` NaN validado                                | COMPLETO         | `CampDetailPage.tsx`                                                                                        |
| React key sin fallback de índice                     | COMPLETO         | `PersonDetailPage.tsx`, `ExplorationDetailPage.tsx`                                                         |
| `useStats` extraído a `useDashboardStats.ts`         | COMPLETO         | `src/hooks/useDashboardStats.ts`                                                                            |
| Responsive layout con drawer mobile                  | COMPLETO         | `AppShell.tsx:159-212` — Sheet en mobile, sidebar en desktop                                                |
| Documentación actualizada                            | COMPLETO         | `README.md`, `ROLES_ACCESS.md`, milestones, workflow docs                                                   |
| Server time infrastructure                           | COMPLETO         | `ServerTimeSync` en `App.tsx`, `getServerNow()` interpolado                                                 |
| Status "DECEASED" vs "DEAD" corregido                | COMPLETO         | `PeopleListPage.tsx`                                                                                        |
| Rations API/hooks/types layer                        | COMPLETO         | `src/features/rations/api/`, `hooks/`, `types/`                                                             |
| `RoleGate` component infrastructure                  | COMPLETO (infra) | `src/shared/guards/RoleGate.tsx` — pero NUNCA usado (ver gaps abajo)                                        |

## Qué partes siguen INCOMPLETAS (faltantes reales contra requerimientos-frontend.md)

| #   | Requisito     | Gap                                                                                                                                                                                                       | Severidad |
| --- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | RF-01         | **LockScreen**: no existe componente. `isLocked`/`lock()`/`unlock()` existen en el store pero `logout()` se llama en vez de bloquear. `unlock()` nunca se invoca.                                         | CRÍTICO   |
| 2   | RF-01 / RF-08 | **Camp change no resetea sesión**: `handleCampChange()` (`AppShell.tsx:32-48`) no llama `updateActivity()`.                                                                                               | ALTO      |
| 3   | RF-03         | **Dashboard no accesible para worker/travel_coordinator**: `roleGuards.ts:4` bloquea estos roles. El requerimiento dice que deben ver sus recursos asignados.                                             | ALTO      |
| 4   | RF-03         | **Dashboard ignora campamento activo**: `DashboardPage.tsx` nunca lee `activeCamp` del store. Las métricas son globales, no por campamento.                                                               | ALTO      |
| 5   | RF-04         | **Image/ID card upload**: `FileInput.tsx` existe pero NO se usa en `AdmissionsPage` ni `PersonCreatePage`. Ambas usan inputs de texto para URLs.                                                          | ALTO      |
| 6   | RF-04         | **Corrección de decisión AI**: solo se puede aceptar/rechazar. No hay UI para corregir la profesión sugerida ni añadir razón de override.                                                                 | ALTO      |
| 7   | RF-04         | **Auto-asignar ID y profesión al aceptar**: `ai_suggested_profession` se muestra pero nunca se actúa sobre ella al aceptar. No se crea automáticamente la persona.                                        | ALTO      |
| 8   | RF-04         | **Generación de reporte**: no hay PDF, export, ni descarga de reporte de aceptación/rechazo.                                                                                                              | MEDIO     |
| 9   | RF-05         | **Work availability en UI**: el estado (HEALTHY/SICK/etc.) no muestra indicador de "disponible para trabajar" en `PeopleListPage` ni `PersonDetailPage`. Solo se filtra en exploraciones.                 | MEDIO     |
| 10  | RF-06         | **Procesamiento automático diario comida/agua**: cero implementación frontend. `auto_daily` existe en el tipo pero no es configurable en el formulario de recurso.                                        | ALTO      |
| 11  | RF-06         | **Procesamiento automático diario consumo raciones**: cero implementación frontend.                                                                                                                       | ALTO      |
| 12  | RF-06         | **Formulario de ingreso manual por persona**: el formulario de ajuste de inventario (`InventoryPage.tsx`) es genérico (no tiene selector de persona ni concepto de "meta").                               | MEDIO     |
| 13  | RF-06         | **Nombres de recurso en auditoría**: `InventoryAuditPage.tsx:115` muestra `String(entry.resource_type_id)` (un número) en vez del nombre del recurso por falta de join en el tipo.                        | MEDIO     |
| 14  | RF-07         | **Consumo de raciones en exploraciones**: cero implementación. Crear/iniciar exploración no deduce raciones del inventario.                                                                               | ALTO      |
| 15  | RF-09         | **Invalidación de inventario en transfers**: ninguna mutación de transfer (`approveSource`, `approveTarget`, `complete`) invalida queries de inventory. El inventario no se actualiza automáticamente.    | ALTO      |
| 16  | RF-09         | **Grupos para envío de personas**: no existe feature `groups/`. Cero archivos. `leader_person_id` en schema pero sin UI input. Sin cálculo de raciones de viaje.                                          | ALTO      |
| 17  | RF-09         | **Audit trail inventory↔transfer**: `TransfersPage` muestra log de eventos pero no los deltas de inventario. `InventoryAuditPage` no filtra por transfer ID.                                              | MEDIO     |
| 18  | RF-09         | **Double approval no es específico a préstamos**: aplica a todos los tipos de transferencia, no solo resource loans como pide el requerimiento.                                                           | BAJO      |
| 19  | RNF-03        | **Gamificación**: cero elementos. Sin progreso, niveles, logros, badges, recompensas visuales, XP, misiones. `Progress` de shadcn existe pero no se usa. `RingMeter` existe sin contexto de gamificación. | ALTO      |
| 20  | RNF-03        | **Bug `@keyframes drift`**: `WaveBackground.tsx` referencia animación `drift` pero el keyframe no existe en ningún CSS. Los blobs del fondo no se animan.                                                 | BAJO      |
| 21  | RNF-05        | **Tests E2E Playwright**: cero archivos de test (`.spec.ts`, `.test.ts`). Playwright no instalado. Sin `playwright.config.*`.                                                                             | CRÍTICO   |
| 22  | RNF-05        | **CI/CD**: `.github/workflows/` no existe. Sin GitHub Actions.                                                                                                                                            | CRÍTICO   |
| 23  | RNF-06        | **Vercel deployment config**: no existe `vercel.json`. Sin configuración de despliegue.                                                                                                                   | ALTO      |
| 24  | RNF-07        | **Documentación del modelo AI**: no se documenta qué modelo se usa, cómo se toman decisiones, ni hay confidence scores.                                                                                   | BAJO      |
| 25  | RF-06         | **Contribution overrides sin UI**: `useCreateContributionOverride` hook y API existen pero ninguna página los usa (dead code).                                                                            | MEDIO     |
| 26  | —             | **`useCreateRation` hook no usado**: `rationsApi.create` existe (genera formato antiguo key=value). `RationsPage` usa `useCreateInventoryAdjustment` directamente. Es dead code.                          | BAJO      |
| 27  | —             | **`ResourcesPage.tsx` duplicado**: `src/features/inventory/pages/ResourcesPage.tsx` idéntico a `src/features/resources/pages/ResourcesPage.tsx`. Solo el segundo está routeado.                           | BAJO      |
| 28  | —             | **`RoleGate` nunca usado**: el componente existe (`src/shared/guards/RoleGate.tsx`) pero 0 imports. Sin per-action gating en páginas compartidas como `/transfers`.                                       | BAJO      |

## Riesgos técnicos detectados

1. **Sin tests** → regresiones invisibles. Cualquier cambio puede romper funcionalidad sin detección.
2. **Sin CI/CD** → no hay validación automática. El deploy a Vercel es manual y no reproducible.
3. **LockScreen ausente** → el requerimiento RF-01 exige bloqueo de sesión con re-autenticación. Sin esto, la funcionalidad no cumple.
4. **Exploraciones sin consumo de raciones** → la economía de recursos del campamento no se refleja correctamente.
5. **Transfers sin sync de inventario** → los movimientos entre campamentos no se reflejan hasta refresh manual.
6. **Sin grupos** → el envío de personas entre campamentos (RF-09) no puede completarse sin esta feature.

## Áreas más inestables

- `src/features/transfers/pages/TransfersPage.tsx` (905 líneas) — página monolítica con lógica de creación, workflow, log y diálogos. Riesgo alto de break en refactors.
- `src/features/explorations/pages/ExplorationsPage.tsx` (816 líneas) — similar, página monolítica con create/update/return/delete.
- `src/features/rations/pages/RationsPage.tsx` (415 líneas) — aún usa `as Record<string, unknown>` en líneas 44-56.
- `src/features/inventory/types/inventory.types.ts` — `InventoryAuditEntry` sin campo `resource` join (línea 23).

---

# Persona A — Infraestructura, Auth, DevOps, Gamificación, Sistema

**Área**: LockScreen, session management, dashboard access, tests, CI/CD, deploy, gamification engine, utilidades compartidas, dead code cleanup.

---

## A1. LockScreen — componente de bloqueo de sesión

- **Descripción**: RF-01 exige que al expirar la sesión, el sistema se bloquee y solicite re-autenticación. Actualmente `auth-context.tsx:52-53` llama `lock()` + `logout()`, destruyendo la sesión. `isLocked` state existe pero no hay UI. `unlock()` nunca se invoca.
- **Archivos involucrados**:
  - Nuevo: `src/components/LockScreen.tsx`
  - Modificar: `src/features/auth/auth-context.tsx:52-53` (cambiar `lock()`+`logout()` → solo `lock()`)
  - Modificar: `src/features/auth/store/auth.store.ts:59-64` (agregar `isLocked` a `partialize`)
  - Modificar: `src/App.tsx` o `src/routes/ProtectedRoute.tsx` (check `isLocked`, render `<LockScreen />`)
- **Prioridad**: CRÍTICA
- **Complejidad**: Media
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Bajo (archivos nuevos + cambios puntuales en auth)

---

## A2. Camp change resetea inactivity timer

- **Descripción**: `AppShell.tsx:32-48` `handleCampChange()` no llama `updateActivity()`. RF-01/RF-08 exigen que al cambiar de campamento se reinicie la sesión.
- **Archivos involucrados**: `src/layouts/AppShell.tsx:32-48` (agregar `useAuthStore.getState().updateActivity()`)
- **Prioridad**: ALTA
- **Complejidad**: Baja
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Medio (AppShell es compartido, pero el cambio es 1 línea)

---

## A3. Dashboard accesible para worker y travel_coordinator

- **Descripción**: RF-03 dice "Para otros roles: solo se muestran los recursos asignados a esa persona". Actualmente `roleGuards.ts:4` bloquea `/dashboard` a solo `system_admin` y `resource_manager`. Workers y travel_coordinators no pueden ver dashboard.
- **Archivos involucrados**:
  - `src/shared/lib/roleGuards.ts:4` (agregar `'worker'`, `'travel_coordinator'`)
  - `src/hooks/useNavItems.ts:30` (agregar roles al nav item dashboard)
  - `src/pages/DashboardPage.tsx:42-74` (agregar módulos para worker y travel_coordinator)
  - `src/hooks/useDashboardStats.ts` (agregar queries específicas por rol)
- **Prioridad**: ALTA
- **Complejidad**: Media
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Bajo (área de Persona A)

---

## A4. Dashboard refleja campamento activo

- **Descripción**: `DashboardPage.tsx` nunca importa `useCampStore` ni lee `activeCamp`. Las métricas son globales (todos los camps). RF-03 exige "El dashboard refleja el campamento activo actualmente".
- **Archivos involucrados**:
  - `src/pages/DashboardPage.tsx` (importar `useCampStore`, filtrar queries por `activeCamp`)
  - `src/hooks/useDashboardStats.ts` (aceptar `campId` opcional, filtrar queries)
- **Prioridad**: ALTA
- **Complejidad**: Media
- **Dependencias**: A3 (coordinar acceso al dashboard)
- **Riesgo de conflicto**: Medio (DashboardPage es compartido)

---

## A5. Tests E2E con Playwright

- **Descripción**: RNF-05 exige pruebas automáticas con Playwright cubriendo flujos críticos + CI. Cero tests actualmente.
- **Archivos involucrados**:
  - Nuevo: `playwright.config.ts`
  - Nuevo: `e2e/` directorio con tests de flujos críticos:
    - Login/logout
    - Crear campamento + cambiar campamento activo
    - Crear persona (admission flow)
    - Crear exploración + retorno
    - Crear transferencia + aprobación
    - Navegación por rol
  - Modificar: `package.json` (agregar `@playwright/test`, scripts `test`, `test:e2e`)
- **Prioridad**: CRÍTICA
- **Complejidad**: Alta (6+ escenarios E2E)
- **Dependencias**: Ninguna (tests validan comportamiento actual)
- **Riesgo de conflicto**: Ninguno (archivos nuevos)

---

## A6. CI/CD con GitHub Actions

- **Descripción**: RNF-05 exige CI automático. Sin `.github/workflows/`.
- **Archivos involucrados**:
  - Nuevo: `.github/workflows/ci.yml` (lint, spell, build, typecheck)
  - Nuevo: `.github/workflows/playwright.yml` (tests E2E en CI)
- **Prioridad**: CRÍTICA
- **Complejidad**: Media
- **Dependencias**: A5 (Playwright debe estar configurado)
- **Riesgo de conflicto**: Ninguno (archivos nuevos)

---

## A7. Vercel deployment config

- **Descripción**: RNF-06 exige frontend desplegado en Vercel accesible públicamente. No existe `vercel.json`.
- **Archivos involucrados**:
  - Nuevo: `vercel.json` (SPA rewrite rules, build config)
  - Modificar: `package.json` (verificar build script)
- **Prioridad**: ALTA
- **Complejidad**: Baja
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Ninguno (archivos nuevos)

---

## A8. Gamificación — infraestructura y motor

- **Descripción**: RNF-03 exige "Elementos de gamificación funcionales (progreso, niveles, logros, o recompensas visuales)". Cero implementación.
- **Archivos involucrados**:
  - Nuevo: `src/features/gamification/types/gamification.types.ts` (tipos: `Achievement`, `UserProgress`, `Level`)
  - Nuevo: `src/features/gamification/api/gamification.api.ts` (endpoints si existen en backend, o mock/local)
  - Nuevo: `src/features/gamification/hooks/useGamification.ts` (queries/mutations)
  - Nuevo: `src/features/gamification/store/gamification.store.ts` (Zustand — client state para progreso)
  - Nuevo: `src/features/gamification/index.ts`
- **Prioridad**: ALTA
- **Complejidad**: Alta
- **Dependencias**: Ninguna (feature nueva)
- **Riesgo de conflicto**: Ninguno (feature nueva)
- **Nota**: La implementación específica de elementos visuales corresponde a Persona B (A8 es solo infraestructura: tipos, store, hooks)

---

## A9. Arreglar `@keyframes drift` bug en WaveBackground

- **Descripción**: `WaveBackground.tsx:11,19,27` referencia animación `drift` pero no existe `@keyframes drift` en ningún CSS.
- **Archivos involucrados**:
  - `src/app/styles/globals.css` (agregar `@keyframes drift`)
  - `src/components/cyber/WaveBackground.tsx` (verificar valores)
- **Prioridad**: BAJA
- **Complejidad**: Baja
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Ninguno

---

## A10. Limpiar dead code restante

- **Descripción**: `src/features/inventory/pages/ResourcesPage.tsx` duplicado (idéntico a `src/features/resources/pages/ResourcesPage.tsx`). `src/features/rations/api/rations.api.ts` función `create` con formato key=value obsoleto (no usada por `RationsPage.tsx`). `useCreateRation` hook no usado.
- **Archivos involucrados**:
  - Eliminar: `src/features/inventory/pages/ResourcesPage.tsx`
  - Evaluar: `src/features/rations/api/rations.api.ts:19-36` (función `create` — ¿usarla o eliminarla?)
  - Evaluar: `src/features/rations/hooks/useRations.ts:16-24` (`useCreateRation` — unused)
- **Prioridad**: BAJA
- **Complejidad**: Baja
- **Dependencias**: Verificar imports antes de eliminar
- **Riesgo de conflicto**: Bajo

---

## A11. Contribution overrides — crear UI

- **Descripción**: `useCreateContributionOverride` hook y API existen (`people.api.ts:58-59`) pero ninguna página los usa. RF-06 menciona "Formulario para registrar manualmente un cambio en el ingreso (cuando una persona no puede cumplir su objetivo)". El override de contribución implementa exactamente esto.
- **Archivos involucrados**:
  - Modificar: `src/features/people/pages/PersonDetailPage.tsx` (agregar sección/dialog para contribution override)
  - Usar: `src/features/people/hooks/usePeople.ts:101-111` (`useCreateContributionOverride`)
- **Prioridad**: MEDIA
- **Complejidad**: Media
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Medio (PersonDetailPage es compartido con Persona B)

---

# Persona B — Features, Páginas, UI/UX, Componentes Visuales

**Área**: Admission AI flow, image uploads, exploraciones, transfers, inventario, gamificación UI, reportes.

---

## B1. Image/ID card upload con FileInput en admission y persona

- **Descripción**: RF-04 exige "Soporte para subir imágenes de la persona" y "Soporte para subir/mostrar tarjeta de identificación". `FileInput.tsx` existe pero NO se usa. `AdmissionsPage` y `PersonCreatePage` usan `<input type="text">` para URLs.
- **Archivos involucrados**:
  - `src/features/admission/pages/AdmissionsPage.tsx:337,349` (reemplazar text input por `<FileInput>`)
  - `src/features/people/pages/PersonCreatePage.tsx:292` (reemplazar text input por `<FileInput>`)
  - `src/components/cyber/FileInput.tsx` (ya existe, listo para usar)
- **Prioridad**: ALTA
- **Complejidad**: Media
- **Dependencias**: Backend debe aceptar base64 o multipart upload (verificar)
- **Riesgo de conflicto**: Bajo (cambios locales en formularios)

---

## B2. AI decision correction flow — permitir corregir/override

- **Descripción**: RF-04 exige "El usuario final puede revisar, aceptar o corregir la decisión de la IA". Actualmente solo aceptar/rechazar. Falta UI para:
  - Override de la profesión sugerida por la AI
  - Razón de corrección
  - Envío de la decisión corregida al backend
- **Archivos involucrados**:
  - `src/features/admission/pages/AdmissionsPage.tsx:96-105,234-268` (agregar modo "corregir" con campos adicionales)
  - `src/features/admission/components/AIAnalysisPanel.tsx` (agregar indicador de override)
  - `src/features/admission/api/admission.api.ts:15-17,42-43` (posiblemente extender DTO con `corrected_profession`, `correction_reason`)
- **Prioridad**: ALTA
- **Complejidad**: Media
- **Dependencias**: Backend debe aceptar campos de corrección en `PATCH /admission/:id/review`
- **Riesgo de conflicto**: Ninguno (área de Persona B)

---

## B3. Auto-asignar ID y profesión al aceptar admission

- **Descripción**: RF-04 exige "Al aceptar, se asigna automáticamente un ID y un cargo/profesión mediante IA". `ai_suggested_profession` se muestra pero no se actúa. Al hacer clic en "Accept", debería crearse automáticamente la persona con la profesión sugerida.
- **Archivos involucrados**:
  - `src/features/admission/pages/AdmissionsPage.tsx:96-105` (al aceptar, llamar endpoint de creación de persona con `ai_suggested_profession`)
  - Posiblemente nuevo endpoint o modificar `PATCH /admission/:id/review` para que el backend cree la persona
- **Prioridad**: ALTA
- **Complejidad**: Media
- **Dependencias**: Backend debe soportar auto-creación de persona al aceptar admission
- **Riesgo de conflicto**: Bajo

---

## B4. Reporte de aceptación/rechazo (PDF o descargable)

- **Descripción**: RF-04 menciona "Se genera un reporte de aceptación o rechazo". No existe generación de reportes.
- **Archivos involucrados**:
  - Nuevo: componente de reporte (puede ser HTML printable o usar librería como `jsPDF`)
  - Modificar: `src/features/admission/pages/AdmissionsPage.tsx` (botón "Download Report")
  - Modificar: `src/features/admission/components/AdmissionDetailPanel.tsx` (agregar datos al reporte)
- **Prioridad**: MEDIA
- **Complejidad**: Media
- **Dependencias**: Puede necesitar librería (`jspdf`, `html2canvas`)
- **Riesgo de conflicto**: Bajo

---

## B5. Work availability indicators en PeopleListPage y PersonDetailPage

- **Descripción**: RF-05 exige "El estado afecta la disponibilidad laboral de la persona (interfaz lo refleja)". Solo `ExplorationsPage` filtra por AWAY/DEAD. `PeopleListPage` y `PersonDetailPage` no muestran disponibilidad laboral.
- **Archivos involucrados**:
  - `src/features/people/pages/PeopleListPage.tsx:216-223` (agregar columna/badge "AVAILABLE" / "UNAVAILABLE")
  - `src/features/people/pages/PersonDetailPage.tsx:280-283` (agregar indicador de work availability)
- **Prioridad**: MEDIA
- **Complejidad**: Baja
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Bajo

---

## B6. auto_daily en formulario de recurso

- **Descripción**: RF-06 exige procesamiento automático diario. El campo `auto_daily` existe en el tipo y API (`resources.api.ts:9`) pero NO está en el formulario create/edit de `ResourcesPage.tsx`.
- **Archivos involucrados**:
  - `src/features/resources/pages/ResourcesPage.tsx:29-34` (agregar `auto_daily: z.boolean()` al schema)
  - `src/features/resources/pages/ResourcesPage.tsx` (agregar checkbox/switch en el formulario de create/edit)
- **Prioridad**: ALTA
- **Complejidad**: Baja
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Ninguno

---

## B7. Resource names en InventoryAuditPage

- **Descripción**: `InventoryAuditPage.tsx:115` muestra `String(entry.resource_type_id)` (un número) como nombre del recurso. `InventoryAuditEntry` no tiene join `resource`.
- **Archivos involucrados**:
  - `src/features/inventory/types/inventory.types.ts:12-24` (agregar `resource?: { id: number; name: string }` al tipo)
  - `src/features/inventory/pages/InventoryAuditPage.tsx:115` (usar `entry.resource?.name ?? String(entry.resource_type_id)`)
- **Prioridad**: MEDIA
- **Complejidad**: Baja
- **Dependencias**: Backend debe incluir resource name en la respuesta de audit
- **Riesgo de conflicto**: Ninguno

---

## B8. Consumo de raciones en exploraciones

- **Descripción**: RF-07 exige "Las exploraciones consumen raciones adicionales (reflejado en bodega)". Cero implementación. Al crear/activar exploración no se deduce nada del inventario.
- **Archivos involucrados**:
  - `src/features/explorations/pages/ExplorationsPage.tsx:151-183` (`onSubmitCreate` — agregar envío de `allocated_resources` con raciones por miembro × días)
  - `src/features/explorations/hooks/useExplorations.ts` (invalidar inventory queries al crear exploración)
  - Posiblemente: `src/features/rations/` (si se requiere crear ration entries)
- **Prioridad**: ALTA
- **Complejidad**: Media
- **Dependencias**: Backend debe aceptar `allocated_resources` en la creación y deducir inventario
- **Riesgo de conflicto**: Ninguno (área de Persona B)

---

## B9. Inventory invalidation en transfer mutations

- **Descripción**: RF-09 exige "Si se aprueba: los cambios se reflejan automáticamente en la bodega de ambos campamentos". Las mutaciones de transfer (`approveSource`, `approveTarget`, `complete`) solo invalidan `TRANSFERS_KEY`, nunca queries de inventory.
- **Archivos involucrados**:
  - `src/features/transfers/hooks/useTransfers.ts:54-61,66-73,78-85` (agregar `queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'inventory' })` en onSuccess)
- **Prioridad**: ALTA
- **Complejidad**: Baja
- **Dependencias**: Ninguna
- **Riesgo de conflicto**: Ninguno

---

## B10. Groups feature para envío de personas entre campamentos

- **Descripción**: RF-09 exige "Si implica envío de personas: creación de un grupo con el rol correspondiente + raciones para el viaje". No existe feature `groups/`. `leader_person_id` en schema pero sin UI input.
- **Archivos involucrados**:
  - Nuevo: `src/features/groups/types/group.types.ts`
  - Nuevo: `src/features/groups/api/groups.api.ts`
  - Nuevo: `src/features/groups/hooks/useGroups.ts`
  - Nuevo: `src/features/groups/pages/GroupsPage.tsx`
  - Nuevo: `src/features/groups/index.ts`
  - Modificar: `src/features/transfers/pages/TransfersPage.tsx:631-787` (agregar `leader_person_id` input; al crear transfer PERSON, crear grupo)
  - Modificar: `src/routes/AppRoutes.tsx` (agregar ruta `/groups`)
  - Modificar: `src/shared/lib/roleGuards.ts` (agregar acceso a `/groups`)
- **Prioridad**: ALTA
- **Complejidad**: Alta
- **Dependencias**: Backend debe tener endpoints de groups
- **Riesgo de conflicto**: Medio (nuevas rutas + modificar roleGuards)

---

## B11. Audit trail inventory↔transfer link

- **Descripción**: RF-09 exige "Registro de auditoría visible para todas las transacciones entre campamentos". El transfer log muestra eventos pero no deltas de inventario. No hay link entre transfer completada y sus inventory audit entries.
- **Archivos involucrados**:
  - `src/features/transfers/pages/TransfersPage.tsx:463-628` (agregar desglose de recursos movidos en el transfer log)
  - `src/features/inventory/pages/InventoryAuditPage.tsx` (opcional: filtro por transfer_id)
- **Prioridad**: MEDIA
- **Complejidad**: Media
- **Dependencias**: Backend debe incluir resource breakdown en respuesta de transfer
- **Riesgo de conflicto**: Bajo

---

## B12. leader_person_id input en formulario de transferencia

- **Descripción**: `leader_person_id` está en el schema y se envía al API, pero NO hay input en el formulario de creación de transferencia. El usuario nunca puede setearlo.
- **Archivos involucrados**:
  - `src/features/transfers/pages/TransfersPage.tsx:631-787` (agregar selector de persona como líder cuando `type === 'PERSON' || type === 'MIXED'`)
- **Prioridad**: MEDIA
- **Complejidad**: Baja
- **Dependencias**: B10 (groups)
- **Riesgo de conflicto**: Bajo

---

## B13. Gamificación — componentes visuales

- **Descripción**: RNF-03 exige elementos visuales de gamificación. La infraestructura la crea Persona A (A8). Persona B implementa los componentes visuales.
- **Archivos involucrados**:
  - Nuevo: `src/features/gamification/components/AchievementBadge.tsx`
  - Nuevo: `src/features/gamification/components/ProgressBar.tsx` (usar shadcn `Progress`)
  - Nuevo: `src/features/gamification/components/LevelIndicator.tsx` (usar `RingMeter`)
  - Nuevo: `src/features/gamification/components/GamificationPanel.tsx` (widget en Dashboard)
  - Modificar: `src/pages/DashboardPage.tsx` (integrar GamificationPanel)
  - Modificar: `src/layouts/AppShell.tsx` (mostrar nivel/progreso en sidebar/header)
- **Prioridad**: ALTA
- **Complejidad**: Alta
- **Dependencias**: A8 (tipos y store de gamificación)
- **Riesgo de conflicto**: Medio (DashboardPage y AppShell son compartidos)

---

## B14. Documentación del modelo AI en UI

- **Descripción**: RNF-07 exige "El uso de IA en el proyecto está documentado" y "Las decisiones asistidas por IA muestran criterios claros y trazables". La AI existe pero no se documenta qué modelo, ni hay confidence scores.
- **Archivos involucrados**:
  - `src/features/admission/components/AIAnalysisPanel.tsx` (agregar confidence score si el backend lo provee)
  - `src/features/admission/pages/AdmissionsPage.tsx` (agregar tooltip/info sobre el modelo AI usado)
  - Nuevo: `src/features/admission/components/AIModelInfo.tsx` (panel informativo sobre el modelo)
- **Prioridad**: BAJA
- **Complejidad**: Baja
- **Dependencias**: Información del backend sobre el modelo
- **Riesgo de conflicto**: Ninguno

---

# Tareas Bloqueadas

| Tarea                          | Bloqueada por               | Razón                                                                       |
| ------------------------------ | --------------------------- | --------------------------------------------------------------------------- |
| B10 (Groups feature)           | Backend groups endpoints    | Necesita API de grupos para implementar frontend                            |
| B3 (Auto-asignar ID/profesión) | Backend admission review    | Necesita que el backend cree persona al aceptar                             |
| B2 (AI correction flow)        | Backend review DTO          | Necesita que el backend acepte `corrected_profession`                       |
| B8 (Raciones en exploraciones) | Backend allocated_resources | Necesita que el backend deduzca inventario al recibir `allocated_resources` |
| B13 (Gamificación UI)          | A8 (Gamificación infra)     | Necesita tipos, store y hooks definidos                                     |
| A5 (Playwright tests)          | —                           | Puede iniciarse ya, pero el CI (A6) depende de A5                           |
| A6 (CI/CD)                     | A5                          | Necesita Playwright configurado para el workflow de tests                   |

---

# Deuda Técnica Detectada

## Problemas de arquitectura

| #   | Problema                                                  | Ubicación                                 | Impacto                                                                   |
| --- | --------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| 1   | `isLocked`/`lock()`/`unlock()` existen pero son dead code | `auth.store.ts:10,54-55`                  | Funcionalidad de bloqueo incompleta                                       |
| 2   | `RoleGate` existe pero 0 usos — sin per-action gating     | `src/shared/guards/RoleGate.tsx`          | Botones visibles para roles que no deberían verlos en páginas compartidas |
| 3   | `ResourcesPage.tsx` duplicado idéntico                    | `inventory/pages/` y `resources/pages/`   | Confusión de mantenimiento                                                |
| 4   | `useCreateRation` hook + `rationsApi.create` no usados    | `rations/hooks/`, `rations/api/`          | Dead code con formato key=value obsoleto                                  |
| 5   | `useCreateContributionOverride` existe sin UI             | `people/hooks/usePeople.ts:101`           | API implementada pero inaccesible al usuario                              |
| 6   | TransfersPage (905 líneas) monolítico                     | `transfers/pages/TransfersPage.tsx`       | Difícil de mantener y extender                                            |
| 7   | ExplorationsPage (816 líneas) monolítico                  | `explorations/pages/ExplorationsPage.tsx` | Difícil de mantener y extender                                            |

## Inconsistencias de tipos

| #   | Problema                                                     | Ubicación                                  |
| --- | ------------------------------------------------------------ | ------------------------------------------ |
| 1   | `InventoryAuditEntry` sin campo `resource` join              | `inventory/types/inventory.types.ts:12-24` |
| 2   | `RationsPage.tsx:44-56` aún usa `as Record<string, unknown>` | `rations/pages/RationsPage.tsx`            |

## Problemas UX/UI

| #   | Problema                                                 | Ubicación                      |
| --- | -------------------------------------------------------- | ------------------------------ |
| 1   | `@keyframes drift` no definido — WaveBackground no anima | `globals.css` (falta keyframe) |
| 2   | Audit page muestra IDs numéricos como nombres de recurso | `InventoryAuditPage.tsx:115`   |
| 3   | Sin empty states con acciones sugeridas (solo mensajes)  | Varias páginas de lista        |

## Validaciones faltantes

| #   | Problema                                                    | Ubicación                   |
| --- | ----------------------------------------------------------- | --------------------------- |
| 1   | `auto_daily` no está en el schema del formulario de recurso | `ResourcesPage.tsx:29-34`   |
| 2   | `leader_person_id` sin input en formulario de transferencia | `TransfersPage.tsx:631-787` |

## Loading/error states

| #   | Problema                                                                    | Ubicación |
| --- | --------------------------------------------------------------------------- | --------- |
| 1   | Estados de carga y error existen en todas las páginas — sin gaps detectados | —         |

## Problemas de accesibilidad

| #   | Problema                                           | Ubicación      |
| --- | -------------------------------------------------- | -------------- |
| 1   | Sin skip-to-content link                           | `AppShell.tsx` |
| 2   | Sin aria-labels en sidebar toggle y hamburger menu | `AppShell.tsx` |

## Problemas de performance

| #   | Problema                                                            | Ubicación                   |
| --- | ------------------------------------------------------------------- | --------------------------- |
| 1   | Transfer log sin paginación — podría ser lento con muchos transfers | `TransfersPage.tsx:463-628` |
| 2   | RationsPage sin paginación en historial de consumo                  | `RationsPage.tsx:190-278`   |

## Dead code y duplicaciones

| #   | Problema                                           | Ubicación                                        |
| --- | -------------------------------------------------- | ------------------------------------------------ |
| 1   | `ResourcesPage.tsx` duplicado                      | `src/features/inventory/pages/ResourcesPage.tsx` |
| 2   | `useCreateRation` hook no usado                    | `src/features/rations/hooks/useRations.ts:16-24` |
| 3   | `rationsApi.create` con formato key=value obsoleto | `src/features/rations/api/rations.api.ts:19-36`  |
| 4   | `RoleGate` componente sin usar                     | `src/shared/guards/RoleGate.tsx`                 |

---

# Plan Recomendado

## Etapa 1 — Crítico (lo que impide cumplir requerimientos)

| Orden | Tarea | Persona | Descripción                                                        |
| ----- | ----- | ------- | ------------------------------------------------------------------ |
| 1     | A1    | A       | LockScreen — componente + flujo de bloqueo/desbloqueo              |
| 2     | A5    | A       | Tests E2E Playwright — instalar, configurar, escribir 6 escenarios |
| 3     | A6    | A       | CI/CD GitHub Actions — workflows de lint + test                    |
| 4     | A7    | A       | Vercel deploy config — `vercel.json` + deploy                      |
| 5     | B8    | B       | Consumo de raciones en exploraciones                               |
| 6     | B9    | B       | Inventory invalidation en transfer mutations                       |
| 7     | B1    | B       | Image/ID card upload con FileInput                                 |
| 8     | B2    | B       | AI decision correction flow                                        |
| 9     | B3    | B       | Auto-asignar ID/profesión al aceptar admission                     |

## Etapa 2 — Estabilización

| Orden | Tarea | Persona | Descripción                                           |
| ----- | ----- | ------- | ----------------------------------------------------- |
| 10    | A2    | A       | Camp change resetea inactivity timer                  |
| 11    | A3    | A       | Dashboard accesible para worker/travel_coordinator    |
| 12    | A4    | A       | Dashboard refleja campamento activo                   |
| 13    | B6    | B       | auto_daily en formulario de recurso                   |
| 14    | B7    | B       | Resource names en InventoryAuditPage                  |
| 15    | B5    | B       | Work availability indicators                          |
| 16    | B12   | B       | leader_person_id input en formulario de transferencia |
| 17    | A9    | A       | Arreglar `@keyframes drift` en WaveBackground         |

## Etapa 3 — Funcionalidades faltantes

| Orden | Tarea | Persona | Descripción                                         |
| ----- | ----- | ------- | --------------------------------------------------- |
| 18    | B10   | B       | Groups feature completa (si backend lo soporta)     |
| 19    | B11   | B       | Audit trail inventory↔transfer link                 |
| 20    | A8    | A       | Gamificación — tipos, store, hooks                  |
| 21    | B13   | B       | Gamificación — componentes visuales (depende de A8) |
| 22    | B4    | B       | Reporte de aceptación/rechazo (PDF/descargable)     |
| 23    | A11   | A       | Contribution overrides — crear UI                   |

## Etapa 4 — Polish y optimización

| Orden | Tarea | Persona | Descripción                                                             |
| ----- | ----- | ------- | ----------------------------------------------------------------------- |
| 24    | A10   | A       | Limpiar dead code restante (ResourcesPage duplicado, rationsApi.create) |
| 25    | B14   | B       | Documentación del modelo AI en UI                                       |
| 26    | —     | A/B     | Agregar skip-to-content link + aria-labels en AppShell                  |
| 27    | —     | B       | Agregar `RoleGate` usage en páginas compartidas (ej. `/transfers`)      |
| 28    | —     | A       | Revisar `RationsPage.tsx` casts `Record<string, unknown>` restantes     |

---

> **Total de tareas**: 28 (14 Persona A + 14 Persona B)
> **Tareas nuevas (no existían en plan anterior)**: 28 (el plan anterior está completado)
> **Archivos solapados**: `DashboardPage.tsx` (A3, A4, B13), `AppShell.tsx` (A2, A9), `TransfersPage.tsx` (B9, B11, B12)
> **Estrategia**: Persona A trabaja en `feat/infra-auth-devops`, Persona B en `feat/features-ui-gaps`. Persona A mergea primero por tener cambios en shared/routes.
