-- 009_add_fecha_examen.sql
-- Agrega la columna fecha_examen a datos_promocion
ALTER TABLE datos_promocion
  ADD COLUMN IF NOT EXISTS fecha_examen DATE;
