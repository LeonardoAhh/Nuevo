-- ============================================================
-- Plantillas de formatos / exámenes (replaces /flayers)
-- ============================================================
-- Stores reusable exam templates that get printed letter-size.
-- All templates share a fixed header (logo + título + 6 campos
-- estandarizados) and have their own footer with codigo + revisión.
--
-- - SELECT: any authenticated user (so non-dev roles can preview /
--   imprimir).
-- - INSERT/UPDATE/DELETE: dev role only, matching the security
--   hardening pattern from 20260424_security_rls_hardening.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.formatos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_examen TEXT NOT NULL,
  codigo        TEXT NOT NULL,
  revision      SMALLINT NOT NULL DEFAULT 1,
  cuerpo_html   TEXT NOT NULL DEFAULT '',
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT formatos_nombre_chk    CHECK (char_length(trim(nombre_examen)) BETWEEN 2 AND 200),
  CONSTRAINT formatos_codigo_chk    CHECK (char_length(trim(codigo)) BETWEEN 2 AND 50),
  CONSTRAINT formatos_revision_chk  CHECK (revision >= 0 AND revision <= 999),
  CONSTRAINT formatos_cuerpo_chk    CHECK (char_length(cuerpo_html) <= 200000)
);

-- A given codigo can only have one active row at a time. Archived
-- (activo=false) rows can coexist for history/rollback.
CREATE UNIQUE INDEX IF NOT EXISTS formatos_codigo_activo_uniq
  ON public.formatos (codigo)
  WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS formatos_activo_updated_idx
  ON public.formatos (activo, updated_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.formatos_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS formatos_updated_at ON public.formatos;
CREATE TRIGGER formatos_updated_at
  BEFORE UPDATE ON public.formatos
  FOR EACH ROW EXECUTE FUNCTION public.formatos_set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.formatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formatos_select_authenticated" ON public.formatos;
DROP POLICY IF EXISTS "formatos_insert_dev"           ON public.formatos;
DROP POLICY IF EXISTS "formatos_update_dev"           ON public.formatos;
DROP POLICY IF EXISTS "formatos_delete_dev"           ON public.formatos;

CREATE POLICY "formatos_select_authenticated" ON public.formatos
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "formatos_insert_dev" ON public.formatos
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'dev');

CREATE POLICY "formatos_update_dev" ON public.formatos
  FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'dev')
  WITH CHECK (public.get_my_role() = 'dev');

CREATE POLICY "formatos_delete_dev" ON public.formatos
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'dev');
