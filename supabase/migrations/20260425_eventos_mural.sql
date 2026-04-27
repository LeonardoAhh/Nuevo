-- ============================================================================
-- 20260425_eventos_mural.sql
-- Mural público de eventos de la empresa: álbumes + fotos + reseñas anónimas
-- ============================================================================

-- ─── 1. Tablas ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eventos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT NOT NULL,
  descripcion   TEXT,
  fecha         DATE,
  publicado     BOOLEAN NOT NULL DEFAULT TRUE,
  cover_path    TEXT,                                 -- storage path de la foto de portada
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evento_fotos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,                        -- "eventos/<evento_id>/<file>"
  caption       TEXT,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evento_resenas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,                        -- reseñas anónimas, firma con nombre libre
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Índices ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS eventos_publicado_idx      ON eventos(publicado, fecha DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS evento_fotos_evento_idx    ON evento_fotos(evento_id, order_index);
CREATE INDEX IF NOT EXISTS evento_resenas_evento_idx  ON evento_resenas(evento_id, created_at DESC);

-- ─── 3. RLS: lectura 100% pública, escritura restringida ────────────────────

ALTER TABLE eventos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_fotos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_resenas  ENABLE ROW LEVEL SECURITY;

-- Cualquiera (anon + authenticated) puede leer eventos publicados
CREATE POLICY "eventos_select_public" ON eventos
  FOR SELECT TO anon, authenticated
  USING (publicado = TRUE);

CREATE POLICY "evento_fotos_select_public" ON evento_fotos
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eventos e
      WHERE e.id = evento_fotos.evento_id AND e.publicado = TRUE
    )
  );

-- Reseñas: lectura pública (todos los eventos publicados), escritura pública
CREATE POLICY "evento_resenas_select_public" ON evento_resenas
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eventos e
      WHERE e.id = evento_resenas.evento_id AND e.publicado = TRUE
    )
  );

-- Insert público de reseñas con validaciones mínimas (nombre no vacío, rating 1-5,
-- comentario ≤ 2000 chars). Todo lo demás se delega a anti-spam en la UI.
CREATE POLICY "evento_resenas_insert_public" ON evento_resenas
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(nombre)) BETWEEN 2 AND 60
    AND rating BETWEEN 1 AND 5
    AND (comentario IS NULL OR char_length(comentario) <= 2000)
    AND EXISTS (
      SELECT 1 FROM eventos e
      WHERE e.id = evento_resenas.evento_id AND e.publicado = TRUE
    )
  );

-- Mutaciones de eventos y fotos: solo role='dev'
CREATE POLICY "eventos_insert_dev" ON eventos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

CREATE POLICY "eventos_update_dev" ON eventos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

CREATE POLICY "eventos_delete_dev" ON eventos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

CREATE POLICY "evento_fotos_insert_dev" ON evento_fotos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

CREATE POLICY "evento_fotos_update_dev" ON evento_fotos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

CREATE POLICY "evento_fotos_delete_dev" ON evento_fotos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

-- Borrar reseñas: solo dev (moderación)
CREATE POLICY "evento_resenas_delete_dev" ON evento_resenas
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev'));

-- ─── 4. Storage bucket público ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('eventos', 'eventos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Lectura pública
DROP POLICY IF EXISTS "eventos_bucket_read_public" ON storage.objects;
CREATE POLICY "eventos_bucket_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'eventos');

-- Insert / update / delete solo dev
DROP POLICY IF EXISTS "eventos_bucket_insert_dev" ON storage.objects;
CREATE POLICY "eventos_bucket_insert_dev" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'eventos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev')
  );

DROP POLICY IF EXISTS "eventos_bucket_update_dev" ON storage.objects;
CREATE POLICY "eventos_bucket_update_dev" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'eventos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev')
  )
  WITH CHECK (
    bucket_id = 'eventos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev')
  );

DROP POLICY IF EXISTS "eventos_bucket_delete_dev" ON storage.objects;
CREATE POLICY "eventos_bucket_delete_dev" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'eventos'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'dev')
  );

-- ─── 5. Trigger updated_at ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION eventos_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS eventos_touch_updated_at_trg ON eventos;
CREATE TRIGGER eventos_touch_updated_at_trg
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION eventos_touch_updated_at();
