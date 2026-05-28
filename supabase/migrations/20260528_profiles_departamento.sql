-- Scope de evaluadores por departamento.
-- Cada cuenta de evaluador se asocia a un departamento y solo puede
-- ver/evaluar a empleados de ese departamento. Admin/dev no se ven afectados.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS departamento text;

COMMENT ON COLUMN public.profiles.departamento IS
  'Departamento asignado al evaluador. Debe coincidir (sin distinguir acentos/mayúsculas) con employees.departamento / nuevo_ingreso.departamento. NULL para admin/dev (ven todo).';
