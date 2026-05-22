-- Ajustes adicionales para evaluaciones_desempeno
ALTER TABLE IF EXISTS public.evaluaciones_desempeno
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_evaluaciones_desempeno_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evaluaciones_desempeno_updated_at ON public.evaluaciones_desempeno;
CREATE TRIGGER trg_evaluaciones_desempeno_updated_at
BEFORE UPDATE ON public.evaluaciones_desempeno
FOR EACH ROW EXECUTE FUNCTION public.set_evaluaciones_desempeno_updated_at();

