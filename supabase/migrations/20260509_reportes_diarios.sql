-- ─────────────────────────────────────────────────────────────────────────────
-- Table: reportes_diarios
-- Stores uploaded daily attendance report data per month, allowing historical
-- queries and month-over-month comparisons.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reportes_diarios (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes               TEXT NOT NULL,                    -- YYYY-MM format
  data              JSONB NOT NULL,                   -- full array of report rows
  total_empleados   INT NOT NULL DEFAULT 0,
  total_incidencias INT NOT NULL DEFAULT 0,
  tasa_asistencia   NUMERIC(5,2) NOT NULL DEFAULT 0,  -- percentage 0-100
  uploaded_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (mes)
);

-- Index for fast month range queries (comparisons)
CREATE INDEX IF NOT EXISTS idx_reportes_diarios_mes
  ON public.reportes_diarios (mes);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies (match existing patterns)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reportes_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reportes_diarios_select" ON public.reportes_diarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reportes_diarios_insert" ON public.reportes_diarios
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "reportes_diarios_update" ON public.reportes_diarios
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "reportes_diarios_delete" ON public.reportes_diarios
  FOR DELETE TO authenticated USING (true);
