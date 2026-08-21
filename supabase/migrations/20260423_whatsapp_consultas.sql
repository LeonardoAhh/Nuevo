-- Migración: whatsapp_consultas setup completo
-- Agrega columna phone si no existe
-- Agrega RLS policies para lectura/escritura

-- 1. Columna phone (si no existe aún)
ALTER TABLE whatsapp_consultas
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Asegurar que RLS esté habilitado
ALTER TABLE whatsapp_consultas ENABLE ROW LEVEL SECURITY;

-- 3. Policy: usuarios autenticados pueden leer todas las consultas (para dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_consultas'
      AND policyname = 'authenticated_select'
  ) THEN
    CREATE POLICY authenticated_select
      ON whatsapp_consultas
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 4. Policy: service_role puede insertar (webhook usa service_role key)
--    En Supabase, service_role bypasea RLS por defecto — no requiere policy explícita.
--    Solo necesaria si se usa anon key para insert (no es el caso aquí).

-- 5. Índice para búsquedas frecuentes por número
CREATE INDEX IF NOT EXISTS idx_whatsapp_consultas_numero
  ON whatsapp_consultas (numero);

-- 6. Índice para búsquedas por phone (dashboard filter)
CREATE INDEX IF NOT EXISTS idx_whatsapp_consultas_phone
  ON whatsapp_consultas (phone);
