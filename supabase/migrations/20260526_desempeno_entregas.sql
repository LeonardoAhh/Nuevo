-- Tabla para marcar manualmente entrega de evaluaciones semestrales
-- Override / complemento a evaluaciones_desempeno (cuando entrega es en papel).

CREATE TABLE IF NOT EXISTS public.desempeno_entregas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_empleado text NOT NULL,
  periodo         text NOT NULL,
  entregada       boolean NOT NULL DEFAULT false,
  fecha_entrega   date,
  notas           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (numero_empleado, periodo)
);

CREATE INDEX IF NOT EXISTS desempeno_entregas_periodo_idx
  ON public.desempeno_entregas (periodo);
CREATE INDEX IF NOT EXISTS desempeno_entregas_numero_idx
  ON public.desempeno_entregas (numero_empleado);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_desempeno_entregas_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS desempeno_entregas_updated_at ON public.desempeno_entregas;
CREATE TRIGGER desempeno_entregas_updated_at
  BEFORE UPDATE ON public.desempeno_entregas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_desempeno_entregas_updated_at();

-- RLS
ALTER TABLE public.desempeno_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desempeno_entregas_select"
  ON public.desempeno_entregas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "desempeno_entregas_insert"
  ON public.desempeno_entregas
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');

CREATE POLICY "desempeno_entregas_update"
  ON public.desempeno_entregas
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');

CREATE POLICY "desempeno_entregas_delete"
  ON public.desempeno_entregas
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');
