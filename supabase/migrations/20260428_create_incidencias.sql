-- ─────────────────────────────────────────────────────────────────────────────
-- Table: incidencias
-- Tracks employee attendance incidences per month (linked by employee number)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.incidencias (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_empleado TEXT NOT NULL,
  mes           TEXT NOT NULL,                          -- YYYY-MM format
  categoria     TEXT NOT NULL CHECK (categoria IN (
    'FALTA INJUSTIFICADA',
    'DIA FESTIVO',
    'FALTAS JUST',
    'SANCIÓN',
    'PERMISO',
    'CAMBIO TURNO',
    'INCAPACIDAD',
    'VACACIÓN',
    'TXT',
    'DESCANSO',
    'PERMISO HORAS'
  )),
  valor         NUMERIC NOT NULL DEFAULT 0,
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one record per employee+month+category
  UNIQUE (numero_empleado, mes, categoria)
);

-- Index for fast lookups by employee
CREATE INDEX IF NOT EXISTS idx_incidencias_empleado ON public.incidencias (numero_empleado);

-- Index for lookups by employee+month
CREATE INDEX IF NOT EXISTS idx_incidencias_empleado_mes ON public.incidencias (numero_empleado, mes);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies (match existing patterns)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all
CREATE POLICY "incidencias_select" ON public.incidencias
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert
CREATE POLICY "incidencias_insert" ON public.incidencias
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "incidencias_update" ON public.incidencias
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "incidencias_delete" ON public.incidencias
  FOR DELETE TO authenticated USING (true);
