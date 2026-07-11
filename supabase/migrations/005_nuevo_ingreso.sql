CREATE TABLE IF NOT EXISTS nuevo_ingreso (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero                   TEXT,
  nombre                   TEXT NOT NULL,
  puesto                   TEXT,
  departamento             TEXT,
  area                     TEXT,
  turno                    TEXT,
  fecha_ingreso            DATE NOT NULL,
  curp                     TEXT,
  escolaridad              TEXT,
  jefe_area                TEXT,
  -- Evaluaciones de desempeño
  eval_1_fecha             DATE,   -- ~30 días
  eval_1_calificacion      INTEGER,
  eval_2_fecha             DATE,   -- ~60 días
  eval_2_calificacion      INTEGER,
  eval_3_fecha             DATE,   -- ~80 días
  eval_3_calificacion      INTEGER,
  -- Contrato
  termino_contrato         DATE,   -- ~90 días
  tipo_contrato            TEXT DEFAULT 'A prueba',  -- 'A prueba' | 'Indeterminado'
  -- RG-REC-048
  rg_rec_048               TEXT DEFAULT 'Pendiente', -- 'Pendiente' | 'Entregado'
  fecha_vencimiento_rg     DATE,
  -- Meta
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(numero)
);

CREATE INDEX IF NOT EXISTS nuevo_ingreso_nombre_idx      ON nuevo_ingreso(nombre);
CREATE INDEX IF NOT EXISTS nuevo_ingreso_departamento_idx ON nuevo_ingreso(departamento);
CREATE INDEX IF NOT EXISTS nuevo_ingreso_termino_idx     ON nuevo_ingreso(termino_contrato);

ALTER TABLE nuevo_ingreso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nuevo_ingreso_select" ON nuevo_ingreso FOR SELECT TO authenticated USING (true);
CREATE POLICY "nuevo_ingreso_insert" ON nuevo_ingreso FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "nuevo_ingreso_update" ON nuevo_ingreso FOR UPDATE TO authenticated USING (true);
CREATE POLICY "nuevo_ingreso_delete" ON nuevo_ingreso FOR DELETE TO authenticated USING (true);
