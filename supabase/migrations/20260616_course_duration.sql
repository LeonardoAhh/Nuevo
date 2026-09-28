-- Agregar columna duration_hours al catálogo de cursos
-- Permite registrar la duración en horas (decimal) de cada curso para
-- alimentar el KPI "Horas de capacitación por año".
-- Solo los cursos que tengan duration_hours definida serán considerados.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(6, 2) NULL;

COMMENT ON COLUMN courses.duration_hours IS
  'Duración del curso en horas (decimal). NULL = sin definir y no cuenta para el KPI de horas.';
