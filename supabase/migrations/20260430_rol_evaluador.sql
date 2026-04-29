-- Add 'evaluador' role to profiles check constraint
-- The evaluador role can only access /desempeno routes and CRUD evaluaciones_desempeno

-- Update RLS policies on evaluaciones_desempeno to allow evaluador role
DROP POLICY IF EXISTS "evaluaciones_desempeno_insert" ON public.evaluaciones_desempeno;
DROP POLICY IF EXISTS "evaluaciones_desempeno_update" ON public.evaluaciones_desempeno;
DROP POLICY IF EXISTS "evaluaciones_desempeno_delete" ON public.evaluaciones_desempeno;

CREATE POLICY "evaluaciones_desempeno_insert"
  ON public.evaluaciones_desempeno
  FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('dev', 'evaluador'));

CREATE POLICY "evaluaciones_desempeno_update"
  ON public.evaluaciones_desempeno
  FOR UPDATE TO authenticated USING (get_my_role() IN ('dev', 'evaluador'));

CREATE POLICY "evaluaciones_desempeno_delete"
  ON public.evaluaciones_desempeno
  FOR DELETE TO authenticated USING (get_my_role() IN ('dev', 'evaluador'));
