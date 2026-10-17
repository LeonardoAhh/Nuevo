-- Keep assignment management with the account that sees the private Developer tab.
-- Evaluator accounts can still read their own grants for authorization checks.
DROP POLICY IF EXISTS evaluator_assignments_select ON public.evaluator_employee_assignments;
CREATE POLICY evaluator_assignments_select ON public.evaluator_employee_assignments
  FOR SELECT TO authenticated
  USING (
    evaluator_user_id = auth.uid()
    OR (public.get_my_role() = 'dev' AND lower(auth.jwt() ->> 'email') = 'leo@adm.com')
  );

DROP POLICY IF EXISTS evaluator_assignments_insert ON public.evaluator_employee_assignments;
CREATE POLICY evaluator_assignments_insert ON public.evaluator_employee_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() = 'dev'
    AND lower(auth.jwt() ->> 'email') = 'leo@adm.com'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = evaluator_user_id AND role = 'evaluador'
    )
  );

DROP POLICY IF EXISTS evaluator_assignments_delete ON public.evaluator_employee_assignments;
CREATE POLICY evaluator_assignments_delete ON public.evaluator_employee_assignments
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'dev' AND lower(auth.jwt() ->> 'email') = 'leo@adm.com');

-- Existing dev users retain unrelated profile permissions, but only the
-- private Developer account may change evaluator grants or evaluator roles.
CREATE OR REPLACE FUNCTION public.profiles_guard_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.departamentos IS DISTINCT FROM OLD.departamentos)
     AND public.get_my_role() IS DISTINCT FROM 'dev' THEN
    RAISE EXCEPTION 'Only dev can change evaluator permissions'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF (OLD.role = 'evaluador' OR NEW.role = 'evaluador')
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.departamentos IS DISTINCT FROM OLD.departamentos)
     AND lower(auth.jwt() ->> 'email') IS DISTINCT FROM 'leo@adm.com' THEN
    RAISE EXCEPTION 'Only the private developer account can change evaluator permissions'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;
