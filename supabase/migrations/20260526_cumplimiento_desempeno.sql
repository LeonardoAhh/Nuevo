-- Cumplimiento de evaluaciones de desempeño por departamento × periodo
--
-- 1) Agregar columnas `departamento` y `periodo_codigo` a evaluaciones_desempeno
-- 2) Trigger BEFORE INSERT/UPDATE: auto-rellenar `departamento` desde employees
-- 3) Crear tabla `entregas_evaluaciones` (1 fila por depto × periodo, marcado dev)
-- 4) RLS sobre entregas: SELECT todos · INSERT/UPDATE/DELETE solo `dev`
-- 5) Backfill SQL one-shot: depto desde employees + periodo_codigo desde texto libre

-- ─── 1) Columnas nuevas en evaluaciones_desempeno ────────────────────────────

ALTER TABLE public.evaluaciones_desempeno
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS periodo_codigo text;

CREATE INDEX IF NOT EXISTS idx_ed_departamento
  ON public.evaluaciones_desempeno (departamento);

CREATE INDEX IF NOT EXISTS idx_ed_periodo_codigo
  ON public.evaluaciones_desempeno (periodo_codigo);

CREATE INDEX IF NOT EXISTS idx_ed_depto_periodo
  ON public.evaluaciones_desempeno (departamento, periodo_codigo);

-- ─── 2) Trigger: auto-rellenar departamento desde employees ──────────────────

CREATE OR REPLACE FUNCTION public.set_evaluaciones_desempeno_departamento()
RETURNS trigger AS $$
BEGIN
  IF NEW.departamento IS NULL AND NEW.numero_empleado IS NOT NULL THEN
    SELECT e.departamento INTO NEW.departamento
    FROM public.employees e
    WHERE e.numero = NEW.numero_empleado
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evaluaciones_desempeno_departamento
  ON public.evaluaciones_desempeno;

CREATE TRIGGER trg_evaluaciones_desempeno_departamento
  BEFORE INSERT OR UPDATE ON public.evaluaciones_desempeno
  FOR EACH ROW EXECUTE FUNCTION public.set_evaluaciones_desempeno_departamento();

-- ─── 3) Tabla entregas_evaluaciones ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.entregas_evaluaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento text NOT NULL,
  periodo_codigo text NOT NULL,
  entregada_at timestamptz NOT NULL DEFAULT now(),
  entregada_by uuid NOT NULL REFERENCES auth.users(id),
  entregada_by_name text,
  evaluaciones_realizadas int NOT NULL DEFAULT 0,
  evaluaciones_esperadas int NOT NULL DEFAULT 0,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (departamento, periodo_codigo)
);

CREATE INDEX IF NOT EXISTS idx_entregas_depto
  ON public.entregas_evaluaciones (departamento);

CREATE INDEX IF NOT EXISTS idx_entregas_periodo
  ON public.entregas_evaluaciones (periodo_codigo);

CREATE OR REPLACE FUNCTION public.set_entregas_evaluaciones_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entregas_evaluaciones_updated_at
  ON public.entregas_evaluaciones;

CREATE TRIGGER trg_entregas_evaluaciones_updated_at
  BEFORE UPDATE ON public.entregas_evaluaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_entregas_evaluaciones_updated_at();

-- ─── 4) RLS sobre entregas_evaluaciones ──────────────────────────────────────

ALTER TABLE public.entregas_evaluaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entregas_evaluaciones_select" ON public.entregas_evaluaciones;
CREATE POLICY "entregas_evaluaciones_select"
  ON public.entregas_evaluaciones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "entregas_evaluaciones_insert" ON public.entregas_evaluaciones;
CREATE POLICY "entregas_evaluaciones_insert"
  ON public.entregas_evaluaciones
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');

DROP POLICY IF EXISTS "entregas_evaluaciones_update" ON public.entregas_evaluaciones;
CREATE POLICY "entregas_evaluaciones_update"
  ON public.entregas_evaluaciones
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "entregas_evaluaciones_delete" ON public.entregas_evaluaciones;
CREATE POLICY "entregas_evaluaciones_delete"
  ON public.entregas_evaluaciones
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

-- ─── 5) Backfill one-shot ────────────────────────────────────────────────────

-- 5.a) departamento desde employees por numero_empleado
UPDATE public.evaluaciones_desempeno ed
SET departamento = e.departamento
FROM public.employees e
WHERE ed.departamento IS NULL
  AND e.numero IS NOT NULL
  AND ed.numero_empleado = e.numero;

-- 5.b) periodo_codigo desde texto libre `periodo`
-- Reconoce variantes comunes: "ENE-JUN 2026", "Enero-Junio 2026", "2026-1", etc.
UPDATE public.evaluaciones_desempeno
SET periodo_codigo = CASE
  WHEN upper(periodo) ~ '(ENE|ENERO).*(JUN|JUNIO).*2026'  THEN 'ENE-JUN-2026'
  WHEN upper(periodo) ~ '(JUL|JULIO).*(DIC|DICIEMBRE).*2026' THEN 'JUL-DIC-2026'
  WHEN upper(periodo) ~ '(ENE|ENERO).*(JUN|JUNIO).*2025'  THEN 'ENE-JUN-2025'
  WHEN upper(periodo) ~ '(JUL|JULIO).*(DIC|DICIEMBRE).*2025' THEN 'JUL-DIC-2025'
  WHEN periodo ~ '2026.?[-/_ ]?1\b'                       THEN 'ENE-JUN-2026'
  WHEN periodo ~ '2026.?[-/_ ]?2\b'                       THEN 'JUL-DIC-2026'
  WHEN periodo ~ '2025.?[-/_ ]?1\b'                       THEN 'ENE-JUN-2025'
  WHEN periodo ~ '2025.?[-/_ ]?2\b'                       THEN 'JUL-DIC-2025'
  ELSE NULL
END
WHERE periodo_codigo IS NULL AND periodo IS NOT NULL;
