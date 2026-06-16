# PRD — Capacitación Qro

## Problem Statement
En la página `/`, agregar un nuevo KPI para conocer las **horas de capacitación por año** en relación a los cursos tomados por cada empleado. En `/capacitacion`, tab "Cursos", permitir capturar la **duración de cada curso**. El KPI solo toma en cuenta los cursos que ya tengan duración guardada.

## Stack
- Next.js (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- TailwindCSS + Radix UI + Recharts

## Implementado (Enero 2026)
- **Migración SQL** `supabase/migrations/015_course_duration.sql`: nueva columna `courses.duration_hours NUMERIC(6,2)` (nullable).
- **Catálogo de cursos (`/capacitacion` → tab "Cursos")**:
  - Diálogo "Nuevo curso" ahora captura duración opcional en horas decimales.
  - Botón ✏️ en cada curso para editar nombre y/o duración (`CapEditCourseDialog`).
  - Cada curso muestra badge con su duración (`X h`) o badge punteado "sin duración".
- **KPI `Horas de capacitación por año`** (`/` → tab "Capacitación"):
  - Suma horas totales por año a partir de `employee_courses.fecha_aplicacion` cruzando con `courses.duration_hours`.
  - Solo cuenta cursos con `duration_hours > 0`.
  - Muestra: horas totales, promedio h/empleado/año, # de cursos contabilizados, gráfica de barras por año, y desglose por año (empleados únicos, cursos tomados, prom. h/empleado).
  - Estado vacío explícito si aún no hay cursos con duración.

## Acción manual del usuario
1. Ejecutar `supabase/migrations/015_course_duration.sql` en el SQL Editor del proyecto Supabase.
2. Desplegar (Vercel) los cambios de código.
3. En "Capacitación → Cursos", capturar la duración de los cursos para alimentar el KPI.

## Personas
- **RH / Capacitación**: registra duración de cursos y consulta KPI.
- **Líderes**: consultan dashboard con horas de capacitación por año.

## Backlog
- P1: Filtro por departamento en el KPI de horas.
- P2: Comparativa de horas por puesto / por empleado individual.
- P2: Exportar KPI de horas a Excel.

## Próximos pasos
- Validar con el usuario que los datos del KPI son los esperados una vez registrada la duración de algunos cursos.
