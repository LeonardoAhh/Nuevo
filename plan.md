# Plan de Correcciones y Mejoras — Pestaña Desempeño

## Archivos Analizados

| Archivo | Líneas | Rol |
|---|---|---|
| [desempeno-form-operativo.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx) | 793 | Formulario interactivo de evaluación |
| [desempeno-pendientes-drawer.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-pendientes-drawer.tsx) | 179 | Drawer lateral de evaluaciones pendientes |
| [desempeno-print.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.tsx) | 222 | Vista de impresión (formato carta) |
| [desempeno-print.module.css](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.module.css) | 406 | Estilos CSS para impresión |
| [desempeno-seguimiento.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx) | 668 | Dashboard de seguimiento de compromisos |
| [useDesempeno.ts](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/hooks/useDesempeno.ts) | 641 | Hook principal (buscar, guardar, historial) |
| [useCumplimientoDesempeno.ts](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/hooks/useCumplimientoDesempeno.ts) | 321 | Hook de cumplimiento departamental |
| [desempeno.ts (types)](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/types/desempeno.ts) | 3,234 | Tipos + catálogo de objetivos + cálculo |
| [elegibilidad.ts](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/desempeno/elegibilidad.ts) | 115 | Lógica de elegibilidad semestral |

---

## 1. CÓDIGO MUERTO Y DUPLICADO

> [!CAUTION]
> Estos son los problemas más urgentes de calidad de código. Deben resolverse primero.

### 1.1 — Import muerto en `desempeno.ts` (types)
- **Archivo**: [desempeno.ts L1](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/types/desempeno.ts#L1)
- **Problema**: `import { camelCaseAttributes } from "framer-motion"` — nunca se usa en ninguna parte del archivo.
- **Acción**: Eliminar la línea 1 completa.

### 1.2 — `TooltipProvider` sin Tooltips en el formulario
- **Archivo**: [desempeno-form-operativo.tsx L21, L236](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L21)
- **Problema**: Se importa y se usa `TooltipProvider` como wrapper raíz, pero **ningún hijo renderiza `<Tooltip>`**. Es código innecesario.
- **Acción**: Eliminar la importación de `TooltipProvider` y el wrapper `<TooltipProvider>...</TooltipProvider>`.

### 1.3 — Escala graduada duplicada en `useDesempeno.ts`
- **Archivo**: [useDesempeno.ts L238 y L595](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/hooks/useDesempeno.ts#L238)
- **Problema**: La constante `ESCALA_GRADUADA = { 0: 100, 1: 66, 2: 33 }` y su función `aplicarEscala` están definidas **idénticamente** en dos funciones distintas (`buscarEmpleado` y `recalcularAsistencia`). Además, el bloque de cálculo de asistencia (~20 líneas con `faltasDeMes`, filtrado por tipo de incidencia, y aplicación de la escala) está copiado textualmente.
- **Acción**:
  1. Extraer la constante `ESCALA_GRADUADA` y la función `aplicarEscala` al nivel superior del archivo (fuera de cualquier función).
  2. Extraer el bloque de cálculo `calcularAsistenciaPorcentaje(incidencias, mesInicio, mesFin)` como función independiente reutilizable.
  3. Ambas funciones (`buscarEmpleado` y `recalcularAsistencia`) deben llamar a la función extraída.

### 1.4 — `TIPO_LABEL` duplicado con diferente casing
- **Archivos**: [desempeno-form-operativo.tsx L35-39](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L35) y [desempeno-seguimiento.tsx L38-42](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L38)
- **Problema**: Ambos archivos definen `TIPO_LABEL` con valores distintos ("JEFE" vs "Jefe", "OPERATIVO" vs "Operativo"). Esto genera inconsistencia visual.
- **Acción**:
  1. Crear un único `TIPO_LABEL` en un archivo compartido (sugerido: `lib/types/desempeno.ts` o `lib/catalogo.ts`).
  2. Usar casing consistente: `"Jefe"`, `"Operativo"` (Title Case).
  3. Ambos componentes deben importar del mismo lugar.

### 1.5 — `EditButton` como componente interno
- **Archivo**: [desempeno-form-operativo.tsx L217-231](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L217)
- **Problema**: `EditButton` se define como un componente dentro del render del componente padre. Se re-crea en cada renderizado.
- **Acción**: Mover `EditButton` fuera del componente padre (al nivel superior del archivo o a su propio archivo si se reutiliza).

### 1.6 — Archivo de tipos de 3,234 líneas
- **Archivo**: [desempeno.ts](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/types/desempeno.ts)
- **Problema**: ~2,900 líneas son datos de catálogo (`OBJETIVOS_POR_PUESTO`), lo que hace el archivo innavegable. Los tipos y la lógica de cálculo están mezclados con un catálogo masivo de datos.
- **Acción**:
  1. Extraer `OBJETIVOS_POR_PUESTO` a un nuevo archivo: `lib/desempeno/objetivos-catalogo.ts`.
  2. Dejar en `lib/types/desempeno.ts` solo: interfaces, tipos, constantes pequeñas, y `calcularPonderacion`.
  3. El nuevo archivo exporta solo el catálogo; el archivo de tipos lo importa si lo necesita.

---

## 2. ACCESIBILIDAD (A11Y)

> [!WARNING]
> Estos problemas afectan usuarios con discapacidades y puntajes de auditoría (Lighthouse, axe-core).

### 2.1 — Tablas sin `<caption>` ni `scope="col"` en el formulario
- **Archivo**: [desempeno-form-operativo.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx)
- **Líneas afectadas**: L343-362 (Objetivos), L389-406 (Cumplimiento), L474-491 (Competencias)
- **Problema**: Las tres tablas carecen de `<caption>` (invisible para videntes, crucial para lectores de pantalla) y ningún `<th>` tiene `scope="col"`.
- **Acción**: A cada `<Table>`, agregar un hijo `<caption className="sr-only">Tabla de [Objetivos/Cumplimiento/Competencias]</caption>` y a cada `<th>` agregar `scope="col"`.

### 2.2 — `StepDots` sin semántica de navegación
- **Archivo**: [desempeno-form-operativo.tsx L76-89](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L76)
- **Problema**: Los puntos de navegación de paso son solo `<div>`s decorativos. Un lector de pantalla no sabe en qué paso está el usuario.
- **Acción**:
  1. Envolver en `<nav aria-label="Pasos de edición">`.
  2. Añadir `role="tablist"` al contenedor.
  3. Cada punto debe ser `<button role="tab" aria-selected={i === current} aria-label={`Paso ${i+1} de ${total}`}>`.

### 2.3 — Sin `aria-live` para la calificación dinámica
- **Archivo**: [desempeno-form-operativo.tsx L527](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L527)
- **Problema**: Cuando la ponderación se recalcula dinámicamente, los lectores de pantalla no se enteran del cambio.
- **Acción**: Envolver el número de calificación final en `<span aria-live="polite" aria-atomic="true">`.

### 2.4 — Drawer sin focus trap completo
- **Archivo**: [desempeno-pendientes-drawer.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-pendientes-drawer.tsx)
- **Problema**: Al abrir el drawer, el foco se mueve al primer elemento interactivo, pero **no hay un "trap" que impida que Tab salga del drawer hacia el contenido de fondo**. Esto viola WCAG 2.1 criterio 2.4.3.
- **Acción**: Implementar focus trap: al llegar al último elemento focusable dentro del drawer y presionar Tab, el foco debe regresar al primer elemento. Usar una librería como `focus-trap-react` o implementar manualmente con `keydown` listener.

### 2.5 — Vista de impresión sin encabezados semánticos
- **Archivo**: [desempeno-print.tsx](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.tsx)
- **Líneas**: L81, L112, L141
- **Problema**: Los títulos de sección ("OBJETIVOS", "CUMPLIMIENTO", "COMPETENCIAS") son `<div>` con clase CSS. No hay ningún `<h2>` o `<h3>`.
- **Acción**: Cambiar a `<h2 className={styles.sectionTitle}>` para semántica correcta.

### 2.6 — Tablas de impresión sin `scope="col"`
- **Archivo**: [desempeno-print.tsx L85-89, L116-119, L144-148](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.tsx#L85)
- **Acción**: Agregar `scope="col"` a todos los `<th>` de las tablas de impresión.

### 2.7 — Logo con alt genérico
- **Archivo**: [desempeno-print.tsx L64](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.tsx#L64)
- **Problema**: `alt="Logo"` — no es descriptivo.
- **Acción**: Cambiar a `alt="Logo de la empresa"` o el nombre real de la empresa.

### 2.8 — Tarjetas móviles de seguimiento sin `aria-label` en enlace
- **Archivo**: [desempeno-seguimiento.tsx L142-196](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L142)
- **Problema**: `EvalCard` tiene un botón "Ver evaluación" sin `aria-label`, a diferencia del botón equivalente en la versión de escritorio (L264) que sí lo tiene.
- **Acción**: Agregar `aria-label={`Ver evaluación de ${row.empleado_nombre}`}` al botón de la tarjeta móvil.

### 2.9 — `<dl>` con orden semántico invertido en `SummaryCards`
- **Archivo**: [desempeno-seguimiento.tsx L298-306](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L298)
- **Problema**: Los `<dd>` (valores) aparecen antes de los `<dt>` (etiquetas). Según la especificación HTML, `<dt>` debe ir primero.
- **Acción**: Reordenar: `<dt>` primero, luego `<dd>`. Usar `order-first`/`order-last` en CSS si se necesita invertir visualmente.

---

## 3. RESPONSIVE / MOBILE-FIRST

### 3.1 — Grid de incidencias sin breakpoint responsivo
- **Archivo**: [desempeno-form-operativo.tsx L431](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L431)
- **Problema**: `grid-cols-2` sin prefijo responsive. En pantallas muy angostas (<360px), los items se comprimen.
- **Acción**: Cambiar a `grid-cols-1 sm:grid-cols-2`.

### 3.2 — Columna de evaluador truncada sin tooltip
- **Archivo**: [desempeno-seguimiento.tsx L255](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L255)
- **Problema**: `max-w-[10rem]` con `truncate` — en dispositivos táctiles no hay hover, así que el nombre completo nunca se ve.
- **Acción**: Reemplazar `title` por un componente `<Tooltip>` que funcione tanto en hover como en focus (toque largo en móvil).

### 3.3 — Columna de compromisos truncada sin tooltip
- **Archivo**: [desempeno-seguimiento.tsx L244](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L244)
- **Problema**: `max-w-xs` con `truncate` y solo `title` nativo — mismo problema que 3.2.
- **Acción**: Usar `<Tooltip>` con el texto completo del compromiso.

### 3.4 — Anchos fijos en filtros
- **Archivo**: [desempeno-seguimiento.tsx L525, L543](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L525)
- **Problema**: `sm:w-48` y `sm:w-44` son anchos fijos que pueden no adaptarse a contenido más largo.
- **Acción**: Cambiar a `sm:min-w-48 sm:w-auto` para que el select crezca con su contenido pero tenga un mínimo razonable.

---

## 4. HARDCODEO Y NÚMEROS MÁGICOS

> [!IMPORTANT]
> Estos no son bugs visuales pero sí son problemas de mantenibilidad.

### 4.1 — Z-index literales en el drawer
- **Archivo**: [desempeno-pendientes-drawer.tsx L72, L119](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-pendientes-drawer.tsx#L72)
- **Problema**: `z-[99]` y `z-[100]` — si otro componente usa estos mismos valores, habrá colisiones.
- **Acción**: Definir variables CSS `--z-drawer-backdrop` y `--z-drawer-panel` en el layout global, o usar las utilidades de z-index de Tailwind (`z-40`, `z-50`).

### 4.2 — Constantes de animación hardcodeadas
- **Archivo**: [desempeno-pendientes-drawer.tsx L19, L76, L148](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-pendientes-drawer.tsx#L19)
- **Valores**: `stiffness: 300`, `damping: 32`, `duration: 0.18`, `offset: 80`, `velocity: 40`
- **Acción**: Extraer a un objeto `DRAWER_ANIMATION` al inicio del archivo con nombres descriptivos.

### 4.3 — Threshold de 80 para score hardcodeado en 2 archivos
- **Archivos**: [desempeno-print.tsx L26](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.tsx#L26) y [desempeno-seguimiento.tsx L36](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-seguimiento.tsx#L36)
- **Problema**: El valor `80` como umbral mínimo aprobatorio aparece en ambos archivos. Si la regla de negocio cambia, hay que buscarlo manualmente.
- **Acción**: Crear constante compartida `SCORE_MIN_APROBATORIO = 80` en `lib/types/desempeno.ts` e importarla en ambos archivos.

### 4.4 — Periodos de elegibilidad con fechas manuales
- **Archivo**: [elegibilidad.ts L35-37](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/lib/desempeno/elegibilidad.ts#L35)
- **Problema**: `"DIC-MAY 2026": "2026-05-31"` y `"JUN-NOV 2026": "2026-11-30"` — cada año hay que agregar líneas manualmente.
- **Acción**: Crear una función `calcularFinPeriodo(periodo: string): string` que parsee el nombre del periodo y calcule la fecha de fin automáticamente, en lugar de mantener un mapeo estático.

### 4.5 — Número mágico `new Set([2])` para pasos readonly
- **Archivo**: [desempeno-form-operativo.tsx L49](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-form-operativo.tsx#L49)
- **Problema**: `CUMPLIMIENTO_READONLY_STEPS = new Set([2])` — el índice `2` es un número mágico. Si el orden de los steps cambia, esto se rompe silenciosamente.
- **Acción**: Documentar con un comentario qué representa el paso 2, o mejor, usar un enum/constante con nombre descriptivo (`STEP_ASISTENCIA = 2`).

### 4.6 — Body scroll lock frágil
- **Archivo**: [desempeno-pendientes-drawer.tsx L52-58](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-pendientes-drawer.tsx#L52)
- **Problema**: Manipula `document.body.style.cssText` directamente — si otro componente (ej. otro modal) modifica body styles al mismo tiempo, se corrompe.
- **Acción**: Usar `overflow: hidden` toggle simple, o mejor, usar `body-scroll-lock` como paquete dedicado. Alternativa: `document.body.classList.toggle('overflow-hidden')`.

---

## 5. UI/UX — INCONSISTENCIAS Y MEJORAS

### 5.1 — Inconsistencia visual en la calificación final
- **Problema**: La calificación final se muestra de 3 formas distintas:
  - Formulario: `text-8xl` (enorme)
  - Impresión: barra oscura con texto blanco
  - Seguimiento: badge pequeño con color semáforo
- **Acción**: Unificar el componente visual de score. Crear un `<ScoreBadge score={n} size="sm|md|lg" />` reutilizable que use los mismos colores semáforo y bordes redondeados en las 3 vistas, solo variando el tamaño.

### 5.2 — Formato de fecha inconsistente
- **Problema**: El formulario usa un `<Input type="text">` con `maxLength={10}` para fechas (esperando DD/MM/AAAA). No hay picker de calendario. El hook almacena YYYY-MM-DD.
- **Acción**: Reemplazar el input de texto por `<Input type="date" />` nativo o un componente `<DatePicker>` de shadcn/ui. Esto elimina errores de formato y mejora la UX móvil enormemente (los teléfonos muestran un picker nativo).

### 5.3 — Modales sin advertencia de cambios sin guardar
- **Problema**: Si el usuario edita datos dentro de un modal (objetivos, cumplimiento, competencias) y cierra el modal haciendo clic en el backdrop o la X, **los cambios se pierden sin ninguna advertencia**.
- **Acción**: Comparar el estado del buffer de edición con los datos originales. Si hay diferencias, mostrar un diálogo de confirmación: "¿Descartar cambios?" antes de cerrar.

### 5.4 — Navegación de pasos en modales es secuencial
- **Problema**: En el modal de Cumplimiento (tipo Jefe tiene 10 ítems), el usuario debe hacer clic "Siguiente" paso por paso sin poder saltar a un ítem específico.
- **Acción**: Hacer que los `StepDots` sean clickeables (buttons), permitiendo navegación directa al paso deseado.

### 5.5 — Dropdown de evaluador sin búsqueda
- **Problema**: El selector de evaluador muestra todos los evaluadores agrupados por departamento. Con muchos evaluadores, hay que hacer scroll manual.
- **Acción**: Reemplazar el `<Select>` nativo por un `<Combobox>` (searchable select) para que el usuario pueda escribir y filtrar por nombre.

### 5.6 — Sin estado vacío en las tablas del formulario
- **Problema**: Si la evaluación no tiene objetivos definidos, se muestra una tabla vacía sin guía visual.
- **Acción**: Agregar un `<TableRow>` de estado vacío con un ícono, un mensaje como "No hay objetivos definidos" y un botón de acción para agregar.

### 5.7 — Sin validación en porcentajes de objetivos
- **Problema**: Los campos de porcentaje de objetivos aceptan cualquier string. No se valida que la suma sea 100% ni que los valores estén entre 0-100.
- **Acción**:
  1. Agregar `type="number"` con `min="0"` y `max="100"`.
  2. Mostrar un indicador visual debajo de la tabla: "Total: 85% ⚠️ (debe sumar 100%)".

---

## 6. COLORES EN CSS DE IMPRESIÓN

> [!NOTE]
> Los colores hardcodeados en [desempeno-print.module.css](file:///c:/Users/Reclutamiento%20QRO/Desktop/Capacitacion/components/content/desempeno-print.module.css) son **intencionales y correctos**. Las hojas de estilo de impresión necesitan colores fijos porque:
> 1. Los tokens CSS de Tailwind (modo claro/oscuro) no aplican en papel.
> 2. Las impresoras necesitan valores absolutos.
> 3. Ya están organizados como custom properties (`--print-text`, `--print-bg`, etc.) — esto es la mejor práctica.
>
> **No se requiere cambio aquí.** Solo documentar en un comentario al inicio del archivo que son intencionales.

---

## 7. RESUMEN DE PRIORIDADES

| Prioridad | Cambio | Impacto |
|---|---|---|
| 🔴 Alta | 1.3 — Eliminar código duplicado en `useDesempeno.ts` | Mantenibilidad |
| 🔴 Alta | 2.4 — Focus trap en el drawer | Accesibilidad (WCAG) |
| 🔴 Alta | 1.6 — Separar catálogo de 2,900 líneas | Mantenibilidad |
| 🟠 Media | 2.1 — `<caption>` y `scope` en tablas del form | Accesibilidad |
| 🟠 Media | 1.4 — Unificar `TIPO_LABEL` | Consistencia visual |
| 🟠 Media | 5.2 — Reemplazar input de texto por date picker | UX |
| 🟠 Media | 5.3 — Advertencia de cambios sin guardar | UX |
| 🟠 Media | 3.1 — Grid de incidencias responsive | Mobile-first |
| 🟡 Baja | 1.1 — Import muerto | Limpieza |
| 🟡 Baja | 1.2 — TooltipProvider sin uso | Limpieza |
| 🟡 Baja | 4.1 — Z-index literales | Mantenibilidad |
| 🟡 Baja | 5.1 — Componente unificado de ScoreBadge | Consistencia |
| 🟡 Baja | 5.4 — StepDots clickeables | UX |
| 🟡 Baja | 5.5 — Combobox para evaluador | UX |

---

## Verificación

Una vez implementados los cambios:
1. Ejecutar `npm run build` para verificar que no hay errores de compilación.
2. Probar en viewport móvil (360px) y escritorio (1440px).
3. Ejecutar Lighthouse en modo accesibilidad — apuntar a 95+.
4. Probar navegación por teclado completa en el drawer y los modales.
5. Verificar impresión en Chrome (Ctrl+P) — sin cambios visuales en la versión impresa.
