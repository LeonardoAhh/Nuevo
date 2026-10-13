-- Delete the eventos bucket with scripts/empty-eventos-bucket.mjs before
-- applying this migration. Storage buckets must be managed through the API.

DROP POLICY IF EXISTS "eventos_bucket_read_public" ON storage.objects;
DROP POLICY IF EXISTS "eventos_bucket_insert_dev" ON storage.objects;
DROP POLICY IF EXISTS "eventos_bucket_update_dev" ON storage.objects;
DROP POLICY IF EXISTS "eventos_bucket_delete_dev" ON storage.objects;

DROP TABLE IF EXISTS evento_resenas;
DROP TABLE IF EXISTS evento_fotos;
DROP TABLE IF EXISTS eventos;

DROP FUNCTION IF EXISTS eventos_touch_updated_at();
