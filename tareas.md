# Tareas — Gestión del Fin Frontend

> División de trabajo para 2 personas. Separación por dominios: **Persona A** = Infraestructura/Rendimiento/Calidad, **Persona B** = Features/Gestión/UX.
>
> Mínimo overlap: solo `src/App.tsx` y `src/types.ts` requieren coordinación.

---

## PERSONA A — Infraestructura, Rendimiento y Calidad

**No toca feature pages salvo configuración de rutas o paginación.**

| ID  | Tarea                                                                                                                               | Prioridad | Archivos                                                               | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | ------ |
| A1  | Habilitar TypeScript strict mode y corregir errores resultantes                                                                     | 🔴        | `tsconfig.json`, todos los archivos con errores                        | ☐      |
| A2  | Implementar lazy loading con `React.lazy` + `Suspense` para todas las rutas                                                         | 🔴        | `src/App.tsx`                                                          | ☐      |
| A3  | Crear componente Pagination reutilizable y aplicarlo a PopulationRoster, TransferList, AdmissionList, ExpeditionList, InventoryList | 🔴        | `src/components/Pagination.tsx`, feature pages                         | ☐      |
| A4  | Añadir ErrorBoundary global y por feature                                                                                           | 🔴        | `src/components/ErrorBoundary.tsx`, `src/App.tsx`                      | ☐      |
| A5  | Implementar sistema de toast/notificaciones para errores de mutación y feedback                                                     | 🟠        | `src/components/Toaster.tsx`, `src/lib/toast.ts`, `src/store/toast.ts` | ☐      |
| A6  | Configurar Prettier + ESLint reglas adicionales y verificar                                                                         | 🟡        | `.prettierrc`, `.eslintrc.cjs`                                         | ☐      |
| A7  | Crear componente Modal reutilizable (extraer patrón repetido de feature pages)                                                      | 🟡        | `src/components/Modal.tsx`                                             | ☐      |
| A8  | Añadir transiciones de página con `AnimatePresence` en `DashboardLayout`                                                            | 🟡        | `src/layouts/DashboardLayout.tsx`                                      | ☐      |
| A9  | Corregir responsive mobile — nav dock overflow, tablas con scroll horizontal                                                        | 🟡        | `src/layouts/DashboardLayout.tsx`, `src/index.css`                     | ☐      |
| A10 | Crear skeleton variants para todos los patrones de carga faltantes (cards, lists, detail)                                           | 🟢        | `src/components/Skeleton.tsx`                                          | ☐      |
| A11 | Activar botones PREV/NEXT como paginación real en PopulationRoster                                                                  | 🔴        | `src/features/people/PopulationRoster.tsx`                             | ☐      |
| A12 | Configurar Playwright + escribir tests E2E para flujos críticos (login, admission, inventory, transfers)                            | 🔴        | `e2e/` (nuevo), `playwright.config.ts`                                 | ☐      |
| A13 | Configurar CI (GitHub Actions) para lint + build + E2E                                                                              | 🔴        | `.github/workflows/ci.yml`                                             | ☐      |
| A14 | Configurar deploy a Vercel con build reproducible                                                                                   | 🟡        | `vercel.json`, `.github/workflows/deploy.yml`                          | ☐      |

---

## PERSONA B — Features, Gestión de Dominio y UX

**Trabaja en feature pages, tipos, y lógica de negocio. Mínima interacción con infraestructura.**

| ID  | Tarea                                                                                                             | Prioridad | Archivos                                                                                         | Status |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ | ------ |
| B1  | Gamificación — sistema de logros/progreso visual, niveles, recompensas                                            | 🔴        | `src/features/gamification/` (nuevo), `src/layouts/DashboardLayout.tsx` (widget), `src/types.ts` | ☐      |
| B2  | Implementar vista de Trabajador — dashboard filtrado solo a recursos asignados                                    | 🔴        | `src/features/dashboard/DashboardOverview.tsx` (role check + filter)                             | ✅ PARCIAL — vista limitada por campamento con endpoints permitidos. "Recursos asignados al trabajador" bloqueado: no existe endpoint backend. |
| B12 | Unificar roles `worker`/`survivor` — resolver divergencia entre `UserRole` enum y `permissions.ts` ROLES          | 🟡        | `src/types.ts`, `src/lib/permissions.ts`, `src/store/auth.ts`                                    | ✅      |
| B3  | Disponibilidad laboral visual — reflejar estado en roster (columna trabajable, badges)                            | 🟠        | `src/features/people/PopulationRoster.tsx`                                                       | ✅      |
| B4  | Reasignación temporal desde roster — botón/bulk action para cubrir profesiones vacías                             | 🟠        | `src/features/people/PopulationRoster.tsx`                                                       | ✅      |
| B5  | Validar acceso al cambiar campamento — verificar membresía + permisos rol en nuevo campamento                     | 🟠        | `src/layouts/DashboardLayout.tsx` (camp switcher onChange)                                       | ✅      |
| B6  | Transferencia de PERSONAS en modal TransferList — desbloquear tipo PERSON, añadir selector de persona             | 🟠        | `src/features/transfers/TransferList.tsx`                                                        | ☐      |
| B7  | Asignar recursos en creación de exploración — selector de miembros + provisiones a asignar                        | 🟠        | `src/features/explorations/ExpeditionList.tsx`, `src/types.ts`                                   | ✅      |
| B8  | Campos zombie en formulario admisión — signos infección, exposición, nivel amenaza                                | 🟡        | `src/features/admission/AdmissionList.tsx`, `src/types.ts`                                       | 🚫 BLOQUEADO — backend no tiene `infection_signs`, `exposure_level`, `threat_level` en Prisma/Zod |
| B9  | Flujo corregir y re-evaluar IA — botón "corregir" que reenvía datos corregidos a IA                               | 🟡        | `src/features/admission/AdmissionList.tsx`                                                       | ☐      |
| B10 | Indicador procesamiento automático diario — panel de último ciclo + próximo ciclo                                 | 🟡        | `src/features/inventory/InventoryList.tsx`, `src/features/rations/RationsPage.tsx`               | ☐      |
| B11 | Documentar patrones de diseño para defensa (justificación técnica)                                                | 🟡        | `.planning/patterns.md` (nuevo)                                                                  | ☐      |
| B13 | Añadir botón eliminar campamento en CampManagement                                                                | 🟢        | `src/features/camps/CampManagement.tsx`                                                          | ☐      |
| B14 | Extraer status normalization a utilidad compartida — eliminar código duplicado en PersonDetail y PopulationRoster | 🟢        | `src/lib/utils.ts` (`normalizeStatus`)                                                           | ☐      |
| B15 | Justificar rol adicional — UI para proponer/argumentar rol extra (RF-02.6)                                        | 🟡        | `src/features/roles/` o nuevo modal                                                              | ☐      |

---

## ÁREAS DE COORDINACIÓN

| Área     | Archivos                          | Quién toca primero                                     | Nota                          |
| -------- | --------------------------------- | ------------------------------------------------------ | ----------------------------- |
| Rutas    | `src/App.tsx`                     | **A** añade Suspense → B añade nuevas rutas            | Comunicar antes de modificar  |
| Tipos    | `src/types.ts`                    | **B** añade tipos gamificación + zombie → A consume    | Commit atómico por tipo nuevo |
| Layout   | `src/layouts/DashboardLayout.tsx` | **A** corrige responsive → B añade widget gamificación | Hacer en commits separados    |
| Permisos | `src/lib/permissions.ts`          | **B** unifica roles → A usa en guards                  | Sin conflicto si A espera     |

**Protocolo:** antes de tocar shared files, comunicar intención. Commits atómicos por archivo. Nunca mezclar infraestructura + features en mismo commit.

---

## ORDEN DE IMPLEMENTACIÓN

```
SEMANA 1-2: BASE
  A: A1 (strict TS) → A3 (Pagination) → A11 (PREV/NEXT) → A2 (lazy loading)
  B: B12 (unify roles) → B2 (Worker dashboard) → B8 (zombie fields)

SEMANA 3-4: FEATURES
  A: A4 (ErrorBoundary) → A5 (toast system) → A7 (Modal reusable)
  B: B3 (availability) → B4 (reassign from roster) → B5 (camp validation) → B7 (expedition resources)

SEMANA 5-6: EXPERIENCIA
  A: A9 (responsive) → A8 (page transitions) → A6 (lint/prettier) → A10 (skeletons)
  B: B1 (gamification) → B6 (PERSON transfers) → B9 (AI re-evaluate) → B10 (daily processing UI)

SEMANA 7: CIERRE
  A: A12 (Playwright) → A13 (CI) → A14 (Vercel deploy)
  B: B11 (patterns doc) → B15 (rol adicional) → B13 (delete camp) → B14 (normalizeStatus)
```

---

## RESUMEN

|                  | Total  | Completadas |
| ---------------- | ------ | ----------- |
| Tareas Persona A | 14     | 0           |
| Tareas Persona B | 15     | 6 (1 bloqueada)  |
| **Total**        | **29** | **0**       |
