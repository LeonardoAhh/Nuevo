-- ============================================================
-- 008_reglas_examen.sql
-- Reglas de preguntas por departamento y transición de categoría
-- ============================================================

CREATE TABLE IF NOT EXISTS reglas_examen (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento  TEXT NOT NULL,
  transicion    TEXT NOT NULL CHECK (transicion IN ('D_C', 'C_B', 'B_A')),
  num_preguntas INTEGER NOT NULL DEFAULT 20,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (departamento, transicion)
);

CREATE INDEX IF NOT EXISTS reglas_examen_dep_idx ON reglas_examen(departamento);

ALTER TABLE reglas_examen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reglas_examen_select" ON reglas_examen FOR SELECT TO authenticated USING (true);
CREATE POLICY "reglas_examen_insert" ON reglas_examen FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reglas_examen_update" ON reglas_examen FOR UPDATE TO authenticated USING (true);
CREATE POLICY "reglas_examen_delete" ON reglas_examen FOR DELETE TO authenticated USING (true);

-- Datos iniciales basados en las reglas de PRODUCCIÓN
INSERT INTO reglas_examen (departamento, transicion, num_preguntas) VALUES
  ('PRODUCCIÓN',    'D_C', 20), ('PRODUCCIÓN',    'C_B', 30), ('PRODUCCIÓN',    'B_A', 40),
  ('CALIDAD',       'D_C', 20), ('CALIDAD',       'C_B', 30), ('CALIDAD',       'B_A', 40),
  ('MANTENIMIENTO', 'D_C', 20), ('MANTENIMIENTO', 'C_B', 30), ('MANTENIMIENTO', 'B_A', 40),
  ('ALMACÉN',       'D_C', 20), ('ALMACÉN',       'C_B', 30), ('ALMACÉN',       'B_A', 40),
  ('RECURSOS HUMANOS','D_C',20),('RECURSOS HUMANOS','C_B',30),('RECURSOS HUMANOS','B_A',40),
  ('TALLER DE MOLDES','D_C',20),('TALLER DE MOLDES','C_B',30),('TALLER DE MOLDES','B_A',40),
  ('SGI',           'D_C', 20), ('SGI',           'C_B', 30), ('SGI',           'B_A', 40),
  ('METROLOGÍA',    'D_C', 20), ('METROLOGÍA',    'C_B', 30), ('METROLOGÍA',    'B_A', 40),
  ('PROYECTOS',     'D_C', 20), ('PROYECTOS',     'C_B', 30), ('PROYECTOS',     'B_A', 40),
  ('SISTEMAS',      'D_C', 20), ('SISTEMAS',      'C_B', 30), ('SISTEMAS',      'B_A', 40),
  ('LOGÍSTICA',     'D_C', 20), ('LOGÍSTICA',     'C_B', 30), ('LOGÍSTICA',     'B_A', 40)
ON CONFLICT (departamento, transicion) DO NOTHING;
