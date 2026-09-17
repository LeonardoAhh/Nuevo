-- ─────────────────────────────────────────────────────────────────────────────
-- Cumpleaños: agrega fecha_nacimiento, email y cumple_enviado_year
-- a employees (planta) y nuevo_ingreso.
-- cumple_enviado_year guarda el año del último correo de felicitación enviado
-- para evitar reenvíos dentro del mismo año.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── employees (planta) ────────────────────────────────────────────────────────
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS fecha_nacimiento    DATE,
  ADD COLUMN IF NOT EXISTS email               TEXT,
  ADD COLUMN IF NOT EXISTS cumple_enviado_year INT;

-- ── nuevo_ingreso ─────────────────────────────────────────────────────────────
ALTER TABLE public.nuevo_ingreso
  ADD COLUMN IF NOT EXISTS fecha_nacimiento    DATE,
  ADD COLUMN IF NOT EXISTS email               TEXT,
  ADD COLUMN IF NOT EXISTS cumple_enviado_year INT;

-- ── Índices para búsquedas eficientes por mes/día de cumpleaños ───────────────
-- Permite filtrar "cumpleaños de hoy" o "cumpleaños de esta semana" sin
-- un full-table scan en tablas con cientos de registros.

CREATE INDEX IF NOT EXISTS idx_employees_birthday
  ON public.employees (
    EXTRACT(MONTH FROM fecha_nacimiento),
    EXTRACT(DAY   FROM fecha_nacimiento)
  )
  WHERE fecha_nacimiento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nuevo_ingreso_birthday
  ON public.nuevo_ingreso (
    EXTRACT(MONTH FROM fecha_nacimiento),
    EXTRACT(DAY   FROM fecha_nacimiento)
  )
  WHERE fecha_nacimiento IS NOT NULL;
