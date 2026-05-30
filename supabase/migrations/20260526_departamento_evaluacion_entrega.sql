-- Track department-level evaluation delivery per semester
CREATE TABLE IF NOT EXISTS public.departamento_evaluacion_entrega (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento text NOT NULL,
  periodo text NOT NULL,
  entregado boolean NOT NULL DEFAULT false,
  fecha_entrega timestamptz,
  marcado_por text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(departamento, periodo)
);

CREATE INDEX IF NOT EXISTS idx_dept_eval_entrega_periodo
  ON public.departamento_evaluacion_entrega (periodo);

-- RLS
ALTER TABLE public.departamento_evaluacion_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read"
  ON public.departamento_evaluacion_entrega FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert"
  ON public.departamento_evaluacion_entrega FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
  ON public.departamento_evaluacion_entrega FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
