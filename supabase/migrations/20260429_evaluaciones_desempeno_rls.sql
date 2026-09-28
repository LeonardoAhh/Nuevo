-- RLS policies for evaluaciones_desempeno table
-- Matches pattern from 20260424_security_rls_hardening.sql and 20260428_create_incidencias.sql

ALTER TABLE IF EXISTS public.evaluaciones_desempeno ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users
CREATE POLICY "evaluaciones_desempeno_select"
  ON public.evaluaciones_desempeno
  FOR SELECT TO authenticated USING (true);

-- INSERT: only dev role
CREATE POLICY "evaluaciones_desempeno_insert"
  ON public.evaluaciones_desempeno
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');

-- UPDATE: only dev role
CREATE POLICY "evaluaciones_desempeno_update"
  ON public.evaluaciones_desempeno
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');

-- DELETE: only dev role
CREATE POLICY "evaluaciones_desempeno_delete"
  ON public.evaluaciones_desempeno
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');
