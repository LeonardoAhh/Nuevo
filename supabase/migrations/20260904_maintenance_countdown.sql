-- Se puede ejecutar también en instalaciones sin la tabla de configuración.
BEGIN;

CREATE TABLE IF NOT EXISTS public.system_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'false'::jsonb,
  maintenance_ends_at timestamptz
);

-- Conserva la configuración de instalaciones que ya tenían esta tabla.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS maintenance_ends_at timestamptz;

COMMENT ON COLUMN public.system_settings.maintenance_ends_at IS
  'Fin estimado del mantenimiento. No desactiva el bloqueo automáticamente.';

INSERT INTO public.system_settings (id, value)
VALUES ('maintenance_mode', 'false')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT UPDATE (value, maintenance_ends_at) ON public.system_settings TO authenticated;

-- La pantalla debe poder consultar el estado antes de iniciar sesión.
DROP POLICY IF EXISTS maintenance_public_read ON public.system_settings;
CREATE POLICY maintenance_public_read ON public.system_settings
  FOR SELECT TO anon, authenticated
  USING (id = 'maintenance_mode');

-- Misma cuenta habilitada en Configuración > Desarrollador.
-- El correo procede del JWT firmado por Supabase, no de datos del formulario.
DROP POLICY IF EXISTS maintenance_developer_update ON public.system_settings;
CREATE POLICY maintenance_developer_update ON public.system_settings
  FOR UPDATE TO authenticated
  USING (
    id = 'maintenance_mode'
    AND lower(auth.jwt() ->> 'email') = 'leo@adm.com'
  )
  WITH CHECK (
    id = 'maintenance_mode'
    AND lower(auth.jwt() ->> 'email') = 'leo@adm.com'
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime' AND NOT puballtables)
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public' AND tablename = 'system_settings'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
END
$$;

COMMIT;
