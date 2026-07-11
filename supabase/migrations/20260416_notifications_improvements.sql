-- ============================================================
-- Mejoras al sistema de notificaciones
-- 1. Columnas nuevas en notification_preferences (bajas)
-- 2. RLS por rol en baja_notifications
--    Roles: 'dev' (acceso total), 'admin' (solo lectura)
-- ============================================================

-- ─── 1. Nuevas columnas en notification_preferences ──────────────────────────

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_bajas         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_bajas_warning BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_bajas        BOOLEAN NOT NULL DEFAULT false;

-- ─── 2. RLS por rol en baja_notifications ────────────────────────────────────
-- Eliminar TODAS las políticas existentes (previas y nuevas) para evitar conflictos

DROP POLICY IF EXISTS "Authenticated users can read baja_notifications"    ON baja_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert baja_notifications"   ON baja_notifications;
DROP POLICY IF EXISTS "Authenticated users can update baja_notifications"   ON baja_notifications;
DROP POLICY IF EXISTS "Authenticated users can delete baja_notifications"   ON baja_notifications;
DROP POLICY IF EXISTS "baja_select_authenticated"     ON baja_notifications;
DROP POLICY IF EXISTS "baja_insert_dev_only"          ON baja_notifications;
DROP POLICY IF EXISTS "baja_update_dev_or_own_read"   ON baja_notifications;
DROP POLICY IF EXISTS "baja_delete_dev_only"          ON baja_notifications;

-- Función auxiliar: obtener el rol del usuario autenticado
-- (evita un subquery por cada fila evaluada)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- SELECT: todos los usuarios autenticados pueden leer
--   (dev y admin necesitan ver las notificaciones en el panel)
CREATE POLICY "baja_select_authenticated"
  ON baja_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- INSERT: solo 'dev' puede crear bajas
CREATE POLICY "baja_insert_dev_only"
  ON baja_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'dev');

-- UPDATE: solo 'dev' puede actualizar (incluyendo marcar como leída propia)
--   También permitir que cualquier usuario marque SUS notificaciones como leídas
CREATE POLICY "baja_update_dev_or_own_read"
  ON baja_notifications
  FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'dev'
    OR created_by = auth.uid()
  );

-- DELETE: solo 'dev' puede eliminar
CREATE POLICY "baja_delete_dev_only"
  ON baja_notifications
  FOR DELETE
  TO authenticated
  USING (get_my_role() = 'dev');

-- ─── Comentarios para documentación ──────────────────────────────────────────
COMMENT ON POLICY "baja_select_authenticated" ON baja_notifications
  IS 'Todos los usuarios autenticados pueden ver las bajas en el panel';

COMMENT ON POLICY "baja_insert_dev_only" ON baja_notifications
  IS 'Solo rol dev puede registrar nuevas bajas';

COMMENT ON POLICY "baja_update_dev_or_own_read" ON baja_notifications
  IS 'Dev puede actualizar todo; cualquier usuario puede marcar como leída una notificación propia';

COMMENT ON POLICY "baja_delete_dev_only" ON baja_notifications
  IS 'Solo rol dev puede eliminar bajas';
