-- ──────────────────────────────────────────────────────────────────────────────
-- Tabla: actas_seguimiento
-- Registra actas administrativas y planes de seguimiento por empleado.
-- Relacionada a employees por numero_empleado (texto, igual que el resto del schema).
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.actas_seguimiento (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_empleado   TEXT         NOT NULL,
  tipo              TEXT         NOT NULL
                      CHECK (tipo IN ('ACTA ADMINISTRATIVA', 'PLAN DE SEGUIMIENTO')),
  fecha             DATE         NOT NULL,
  descripcion       TEXT,
  fecha_seguimiento DATE,          -- Fecha de revisión/seguimiento pactada
  estatus           TEXT         NOT NULL DEFAULT 'ACTIVO'
                      CHECK (estatus IN ('ACTIVO', 'EN SEGUIMIENTO', 'CERRADO')),
  created_by        UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_actas_seguimiento_empleado
  ON public.actas_seguimiento (numero_empleado);

CREATE INDEX IF NOT EXISTS idx_actas_seguimiento_tipo
  ON public.actas_seguimiento (tipo);

CREATE INDEX IF NOT EXISTS idx_actas_seguimiento_estatus
  ON public.actas_seguimiento (estatus);

-- ── Trigger para updated_at ──────────────────────────────────────────────────
-- Reutiliza la función update_updated_at_column() creada en la migración inicial

CREATE TRIGGER actas_seguimiento_updated_at
  BEFORE UPDATE ON public.actas_seguimiento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.actas_seguimiento ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer
CREATE POLICY "actas_seguimiento_select"
  ON public.actas_seguimiento
  FOR SELECT TO authenticated
  USING (true);

-- Solo dev y admin pueden crear
CREATE POLICY "actas_seguimiento_insert"
  ON public.actas_seguimiento
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('dev', 'admin'));

-- Solo dev y admin pueden actualizar
CREATE POLICY "actas_seguimiento_update"
  ON public.actas_seguimiento
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('dev', 'admin'));

-- Solo dev puede eliminar
CREATE POLICY "actas_seguimiento_delete"
  ON public.actas_seguimiento
  FOR DELETE TO authenticated
  USING (get_my_role() = 'dev');
