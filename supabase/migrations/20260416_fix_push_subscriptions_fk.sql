-- ============================================================
-- Fix: push_subscriptions.user_id debe almacenar auth.uid()
-- directamente, no profiles.id (que es un UUID diferente).
--
-- El flujo correcto es:
--   push_subscriptions.user_id = auth.uid() = profiles.user_id
--
-- La FK anterior apuntaba a profiles(id) que es un UUID
-- auto-generado distinto a auth.uid(), causando que todos
-- los upserts fallaran silenciosamente.
-- ============================================================

-- 1. Eliminar la FK incorrecta
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;

-- 2. Agregar FK correcta apuntando a auth.users(id)
ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 3. Actualizar las políticas RLS para usar auth.uid() = user_id
--    (no cambia lógica, solo deja explícito el significado)
DROP POLICY IF EXISTS "push_select_own" ON push_subscriptions;
DROP POLICY IF EXISTS "push_insert_own" ON push_subscriptions;
DROP POLICY IF EXISTS "push_delete_own" ON push_subscriptions;

CREATE POLICY "push_select_own" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_delete_own" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
