-- ============================================================
-- 1. Agregar baja_notifications a la publicación de Realtime
--    Esto es necesario para que las suscripciones WebSocket
--    funcionen en el cliente.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'baja_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.baja_notifications;
  END IF;
EXCEPTION WHEN others THEN
  -- Ya está en la publicación, ignorar
  NULL;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END
$$;

-- ============================================================
-- 2. Corrección consolidada de push_subscriptions
--    Asegura que:
--      a) user_id referencia auth.users(id) (NO profiles.id)
--      b) Existe UNIQUE(user_id, endpoint) para upserts
--      c) RLS cubre INSERT, SELECT, DELETE y UPDATE (para upsert)
-- ============================================================

-- a) Eliminar FK incorrecta a profiles y agregar la correcta a auth.users
ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- b) Asegurar UNIQUE(user_id, endpoint) para upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'push_subscriptions'
      AND c.contype = 'u'
      AND c.conname = 'push_subscriptions_user_id_endpoint_key'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_id_endpoint_key
      UNIQUE (user_id, endpoint);
  END IF;
END
$$;

-- c) Recrear todas las políticas RLS (limpias)
DROP POLICY IF EXISTS "push_select_own"                     ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_insert_own"                     ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_delete_own"                     ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_update_own"                     ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own push_subscriptions" ON public.push_subscriptions;

CREATE POLICY "push_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE es necesario para que el upsert funcione en conflicto
CREATE POLICY "push_update_own" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
