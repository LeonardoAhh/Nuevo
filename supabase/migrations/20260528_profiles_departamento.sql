-- Scope de evaluadores por departamento(s).
-- Cada cuenta de evaluador se asocia a uno o varios departamentos y solo
-- puede ver/evaluar a empleados de esos departamentos. Admin/dev no se ven
-- afectados (departamentos NULL = ven todo).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS departamentos text[];

COMMENT ON COLUMN public.profiles.departamentos IS
  'Departamentos que el evaluador puede evaluar. Cada valor debe coincidir (sin distinguir acentos/mayúsculas) con employees.departamento / nuevo_ingreso.departamento. NULL/vacío para admin/dev (ven todo).';
