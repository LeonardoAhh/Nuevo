-- Agregar constraint UNIQUE(user_id, endpoint) en push_subscriptions
-- si no existe. Esto es necesario para que el upsert con
-- onConflict: "user_id,endpoint" funcione correctamente.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'push_subscriptions'
      AND c.contype = 'u'
      AND c.conname = 'push_subscriptions_user_id_endpoint_key'
  ) THEN
    ALTER TABLE push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_id_endpoint_key
      UNIQUE (user_id, endpoint);
  END IF;
END
$$;
