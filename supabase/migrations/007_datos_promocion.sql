-- ============================================================
-- 007_datos_promocion.sql
-- Datos de evaluación por empleado para el módulo de Promociones
-- Enlace: numero (N.N) → employees.numero
-- ============================================================

CREATE TABLE IF NOT EXISTS datos_promocion (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero                    TEXT NOT NULL UNIQUE,   -- N.N / employees.numero
  fecha_inicio_puesto       DATE,
  desempeño_actual          DECIMAL(5,2),           -- Desempeño Actual (%)
  periodo_evaluacion        TEXT,                   -- e.g. "JUL-DIC 2025"
  ultima_calificacion_examen DECIMAL(5,2),          -- Última Calificación Examen (%)
  intentos_examen           INTEGER NOT NULL DEFAULT 0,
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS datos_prom_numero_idx ON datos_promocion(numero);

ALTER TABLE datos_promocion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datos_prom_select" ON datos_promocion FOR SELECT TO authenticated USING (true);
CREATE POLICY "datos_prom_insert" ON datos_promocion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "datos_prom_update" ON datos_promocion FOR UPDATE TO authenticated USING (true);
CREATE POLICY "datos_prom_delete" ON datos_promocion FOR DELETE TO authenticated USING (true);
