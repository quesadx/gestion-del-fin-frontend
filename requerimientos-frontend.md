# Requerimientos Frontend — Gestión del Fin
> EIF209 Programación IV · Evaluación del frontend

---

## RF-01 · Autenticación y control de sesión

- [ ] Login con credenciales según rol del usuario
- [ ] Acceso restringido por rol (solo usuarios autorizados entran al sistema)
- [ ] Sesión expira automáticamente tras **20 minutos de inactividad**
- [ ] Al expirar la sesión, el sistema se bloquea y solicita re-autenticación
- [ ] Al cambiar de campamento, el sistema vuelve al inicio y restringe la información según el rol

---

## RF-02 · Roles y permisos (control de acceso por vistas)

- [ ] **Administrador del sistema** — acceso de lectura a todo el sistema; gestiona únicamente el ingreso de personas
- [ ] **Trabajador** — solo puede hacer cambios de inventario autorizados por el gestor de recursos
- [ ] **Gestor de recursos** — gestiona traslados y envíos de recursos entre bodegas/campamentos
- [ ] **Encargado de viajes y comunicación** — gestiona expediciones y negociaciones con otros campamentos
- [ ] Las vistas y acciones disponibles cambian según el rol autenticado
- [ ] Posibilidad de justificar un rol adicional si el estudiante lo argumenta

---

## RF-03 · Dashboard principal

- [ ] Vista de métricas del campamento (disponible para Gestor de recursos y Administrador del sistema)
- [ ] Métricas de bodega visibles en el dashboard
- [ ] Para otros roles: solo se muestran los recursos asignados a esa persona
- [ ] El dashboard refleja el campamento activo actualmente

---

## RF-04 · Gestión de personas — Ingreso

- [ ] Formulario de registro de nueva persona con campos definidos por el estudiante (contexto zombie)
- [ ] Soporte para subir imágenes de la persona
- [ ] Soporte para subir/mostrar tarjeta de identificación
- [ ] La información ingresada es procesada por una IA que decide si se permite o no el ingreso
- [ ] La decisión de la IA debe ser **explicable**: mostrar los criterios usados de forma transparente
- [ ] Se genera un reporte de aceptación o rechazo
- [ ] El usuario final puede **revisar, aceptar o corregir** la decisión de la IA
- [ ] Al aceptar, se asigna automáticamente un ID y un cargo/profesión mediante IA

---

## RF-05 · Gestión de personas — Estado y trabajo

- [ ] Vista del estado de cada persona (sana, enferma, herida, fuera del campamento, etc.)
- [ ] El estado afecta la disponibilidad laboral de la persona (interfaz lo refleja)
- [ ] Si un trabajo/profesión queda sin trabajadores disponibles, se puede reasignar personas de otro rol de forma temporal
- [ ] Interfaz para ejecutar esa reasignación temporal

---

## RF-06 · Gestión de bodega y recursos

- [ ] Vista general de todos los recursos del campamento con su conteo actual
- [ ] Alertas visuales cuando un recurso cae por debajo del mínimo establecido
- [ ] Procesamiento automático diario del ingreso de comida/agua por trabajador
- [ ] Procesamiento automático diario del consumo de raciones por persona
- [ ] Formulario para registrar manualmente un cambio en el ingreso (cuando una persona no puede cumplir su objetivo)
- [ ] Todos los movimientos de bodega quedan reflejados en el inventario principal

---

## RF-07 · Gestión de exploraciones

- [ ] Formulario para agendar una exploración (selección de grupo, fechas estimadas, días extra)
- [ ] Vista de exploraciones activas y su estado
- [ ] Las exploraciones consumen raciones adicionales (reflejado en bodega)
- [ ] Al regresar: formulario de recuento de provisiones traídas
- [ ] Las provisiones del retorno se contabilizan automáticamente en el sistema

---

## RF-08 · Gestión de múltiples campamentos

- [ ] El sistema maneja más de un campamento con información separada (multiempresa)
- [ ] Selector de campamento activo en la interfaz
- [ ] Al cambiar de campamento: reinicio de sesión + acceso restringido según rol

---

## RF-09 · Solicitudes entre campamentos

- [ ] Formulario para enviar solicitudes de recursos o ayuda a otro campamento
- [ ] Vista de solicitudes recibidas y enviadas con estado (pendiente / aprobada / rechazada)
- [ ] Flujo de aprobación/rechazo de solicitudes
- [ ] Si se aprueba: los cambios se reflejan automáticamente en la bodega de ambos campamentos
- [ ] Registro de auditoría visible para todas las transacciones entre campamentos
- [ ] Si implica envío de personas: creación de un grupo con el rol correspondiente + raciones para el viaje
- [ ] Si implica préstamo de recursos: agenda de entrega y aprobación doble (campamento origen y destino)

---

## RF-10 · Consistencia temporal

- [ ] Todas las operaciones críticas usan la **hora del servidor** (no hora local del cliente)
- [ ] No hay inconsistencias de tiempo entre usuarios o campamentos distintos

---

## RNF-01 · Tecnologías obligatorias

- [ ] React 18 + TypeScript + Vite
- [ ] Separación clara entre frontend y backend (consumo mediante API versionada)
- [ ] Estructura de código organizada por capas o por funcionalidades
- [ ] Uso de patrones de diseño frontend justificables en la defensa

---

## RNF-02 · Calidad de código

- [ ] ESLint configurado y pasando sin errores
- [ ] Prettier integrado al flujo de trabajo
- [ ] CSpell integrado
- [ ] TypeScript en modo estricto
- [ ] Componentes reutilizables con separación de responsabilidades
- [ ] Manejo adecuado del estado y efectos (buenas prácticas de React 18)

---

## RNF-03 · UX, animaciones y gamificación

- [ ] Diseño visual coherente con la temática (apocalipsis zombie / militar)
- [ ] Animaciones de carga, transiciones y feedback de acciones
- [ ] Microinteracciones que refuercen la narrativa
- [ ] Elementos de gamificación funcionales (progreso, niveles, logros, o recompensas visuales)
- [ ] La interfaz es amigable y reduce acciones innecesarias

---

## RNF-04 · Rendimiento y adaptabilidad

- [ ] Paginación en listados de datos
- [ ] Carga diferida (lazy loading) donde corresponda
- [ ] Manejo eficiente de procesos asíncronos
- [ ] Diseño responsive (móvil y escritorio)
- [ ] Comportamiento adecuado en conexiones lentas

---

## RNF-05 · Pruebas E2E

- [ ] Pruebas automáticas con **Playwright** cubriendo los flujos críticos
- [ ] Las pruebas se ejecutan en CI de forma automática
- [ ] Los errores críticos son detectados antes del despliegue

---

## RNF-06 · Despliegue

- [ ] Repositorio público en GitHub, accesible y compartido con los profesores
- [ ] Frontend desplegado en **Vercel** y accesible públicamente
- [ ] Proceso de despliegue reproducible

---

## RNF-07 · Uso de IA (explainability)

- [ ] El uso de IA en el proyecto está documentado
- [ ] Las decisiones asistidas por IA muestran criterios claros y trazables en la UI
- [ ] El usuario puede revisar, aceptar o corregir cualquier decisión automatizada

---

*Generado a partir del enunciado oficial del Proyecto Final EIF209 — Gestión del Fin.*
