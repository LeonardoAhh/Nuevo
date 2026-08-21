-- Crear tabla evaluaciones_desempeno
CREATE TABLE IF NOT EXISTS public.evaluaciones_desempeno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_empleado text NOT NULL,
  evaluador_nombre text,
  evaluador_puesto text,
  tipo text NOT NULL DEFAULT 'operativo' CHECK (tipo IN ('operativo','administrativo','jefe')),
  periodo text,
  objetivos jsonb NOT NULL DEFAULT '[]'::jsonb,
  cumplimiento_responsabilidades jsonb NOT NULL DEFAULT '[]'::jsonb,
  competencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  compromisos text,
  fecha_revision text,
  observaciones text,
  calificacion_final int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_desempeno_numero_empleado ON public.evaluaciones_desempeno (numero_empleado);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_desempeno_created_at ON public.evaluaciones_desempeno (created_at);

