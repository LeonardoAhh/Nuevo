-- Tabla de cursos públicos
CREATE TABLE IF NOT EXISTS cursos_publicos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  descripcion TEXT,
  url        TEXT NOT NULL,
  imagen_url TEXT,
  activo     BOOLEAN NOT NULL DEFAULT true,
  orden      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para ordenar eficientemente
CREATE INDEX IF NOT EXISTS cursos_publicos_orden_idx ON cursos_publicos (orden, created_at);

-- RLS
ALTER TABLE cursos_publicos ENABLE ROW LEVEL SECURITY;

-- Lectura pública sin autenticación
CREATE POLICY "cursos_publicos_select_all"
  ON cursos_publicos FOR SELECT
  USING (true);

-- Solo usuarios autenticados con rol 'dev' pueden modificar
CREATE POLICY "cursos_publicos_insert_dev"
  ON cursos_publicos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'dev'
    )
  );

CREATE POLICY "cursos_publicos_update_dev"
  ON cursos_publicos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'dev'
    )
  );

CREATE POLICY "cursos_publicos_delete_dev"
  ON cursos_publicos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'dev'
    )
  );
