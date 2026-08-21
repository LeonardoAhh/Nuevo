-- ============================================================
-- 006_promociones.sql
-- Módulo de Evaluación de Promociones
-- ============================================================

-- Evaluaciones de desempeño por empleado
CREATE TABLE IF NOT EXISTS evaluaciones_desempeño (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  calificacion    DECIMAL(5,2) NOT NULL,
  periodo         TEXT,          -- e.g. "2025-Anual", "2024-Q2"
  evaluador       TEXT,
  observaciones   TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reglas de promoción configurables por puesto
CREATE TABLE IF NOT EXISTS reglas_promocion (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  puesto                      TEXT NOT NULL UNIQUE,
  promocion_a                 TEXT,                             -- puesto destino de la promoción
  min_temporalidad_meses      INTEGER NOT NULL DEFAULT 12,      -- meses mínimos en el puesto
  min_calificacion_examen     DECIMAL(5,2) NOT NULL DEFAULT 80, -- calificación mínima en examen teórico
  min_calificacion_evaluacion DECIMAL(5,2) NOT NULL DEFAULT 70, -- calificación mínima en evaluación de desempeño
  min_porcentaje_cursos       DECIMAL(5,2) NOT NULL DEFAULT 80, -- % mínimo de cursos completados
  descripcion                 TEXT,
  activo                      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS eval_desemp_employee_idx ON evaluaciones_desempeño(employee_id);
CREATE INDEX IF NOT EXISTS eval_desemp_fecha_idx    ON evaluaciones_desempeño(fecha DESC);
CREATE INDEX IF NOT EXISTS reglas_prom_puesto_idx   ON reglas_promocion(puesto);

-- RLS
ALTER TABLE evaluaciones_desempeño ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_promocion       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_desemp_select" ON evaluaciones_desempeño FOR SELECT TO authenticated USING (true);
CREATE POLICY "eval_desemp_insert" ON evaluaciones_desempeño FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "eval_desemp_update" ON evaluaciones_desempeño FOR UPDATE TO authenticated USING (true);
CREATE POLICY "eval_desemp_delete" ON evaluaciones_desempeño FOR DELETE TO authenticated USING (true);

CREATE POLICY "reglas_prom_select" ON reglas_promocion FOR SELECT TO authenticated USING (true);
CREATE POLICY "reglas_prom_insert" ON reglas_promocion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reglas_prom_update" ON reglas_promocion FOR UPDATE TO authenticated USING (true);
CREATE POLICY "reglas_prom_delete" ON reglas_promocion FOR DELETE TO authenticated USING (true);
