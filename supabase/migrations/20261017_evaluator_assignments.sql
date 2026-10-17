-- Permissions are attached to login accounts, including shared evaluator accounts.
-- Department grants and individual grants are additive. No grants means no access.

CREATE TABLE IF NOT EXISTS public.evaluator_employee_assignments (
  evaluator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_empleado text NOT NULL CHECK (btrim(numero_empleado) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (evaluator_user_id, numero_empleado)
);

CREATE INDEX IF NOT EXISTS evaluator_employee_assignments_numero_idx
  ON public.evaluator_employee_assignments (numero_empleado);
CREATE INDEX IF NOT EXISTS employees_numero_evaluator_idx
  ON public.employees (numero);

ALTER TABLE public.evaluator_employee_assignments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.evaluator_employee_assignments TO authenticated;

-- Stop if production has additional policies that could override these
-- restrictions. Review pg_policies and reconcile them before deploying.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'employees' AND policyname NOT IN ('employees_select', 'employees_insert_dev', 'employees_update_dev', 'employees_delete_dev'))
        OR (tablename = 'nuevo_ingreso' AND policyname NOT IN ('nuevo_ingreso_select', 'nuevo_ingreso_insert', 'nuevo_ingreso_update', 'nuevo_ingreso_delete'))
        OR (tablename = 'evaluaciones_desempeno' AND policyname NOT IN ('evaluaciones_desempeno_select', 'evaluaciones_desempeno_insert', 'evaluaciones_desempeno_update', 'evaluaciones_desempeno_delete'))
        OR (tablename = 'incidencias' AND policyname NOT IN ('incidencias_select', 'incidencias_insert', 'incidencias_update', 'incidencias_delete'))
        OR (tablename = 'desempeno_entregas' AND policyname NOT IN ('desempeno_entregas_select', 'desempeno_entregas_insert', 'desempeno_entregas_update', 'desempeno_entregas_delete'))
        OR (tablename = 'employee_courses' AND policyname NOT IN ('employee_courses_select', 'employee_courses_insert_dev', 'employee_courses_update_dev', 'employee_courses_delete_dev'))
      )
  ) THEN
    RAISE EXCEPTION 'Review unexpected employee or evaluation policies in pg_policies before applying evaluator assignments';
  END IF;
END;
$$;

CREATE POLICY evaluator_assignments_select ON public.evaluator_employee_assignments
  FOR SELECT TO authenticated
  USING (evaluator_user_id = auth.uid() OR public.get_my_role() = 'dev');
CREATE POLICY evaluator_assignments_insert ON public.evaluator_employee_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() = 'dev'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = evaluator_user_id AND role = 'evaluador'
    )
  );
CREATE POLICY evaluator_assignments_delete ON public.evaluator_employee_assignments
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'dev');

-- Developers manage evaluator profiles; evaluators may still edit ordinary
-- profile fields, but must never grant themselves departments or a new role.
CREATE POLICY profiles_select_dev ON public.profiles
  FOR SELECT TO authenticated USING (public.get_my_role() = 'dev');
CREATE POLICY profiles_update_dev ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'dev')
  WITH CHECK (public.get_my_role() = 'dev');

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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_role_trg ON public.profiles;
CREATE TRIGGER profiles_guard_role_trg
  BEFORE UPDATE OF role, departamentos ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role();

-- Matches normalizeDepartamento in lib/catalogos/organizacion.ts for the
-- department names currently stored by the application.
CREATE OR REPLACE FUNCTION public.evaluator_normalize_department(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT translate(lower(btrim(coalesce(value, ''))), 'áéíóúüñ', 'aeiouun');
$$;

CREATE OR REPLACE FUNCTION public.can_evaluate_employee(p_numero text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_departamentos text[];
  v_new_id uuid;
  v_new_department text;
  v_contract text;
  v_employee_id uuid;
  v_employee_department text;
  v_department text;
BEGIN
  IF auth.uid() IS NULL OR nullif(btrim(p_numero), '') IS NULL THEN
    RETURN false;
  END IF;

  SELECT role, departamentos INTO v_role, v_departamentos
  FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  IF v_role IN ('dev', 'admin') THEN
    RETURN true;
  END IF;
  IF v_role IS DISTINCT FROM 'evaluador' THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.evaluator_employee_assignments
    WHERE evaluator_user_id = auth.uid() AND numero_empleado = p_numero
  ) AND (
    EXISTS (SELECT 1 FROM public.employees WHERE numero = p_numero)
    OR EXISTS (SELECT 1 FROM public.nuevo_ingreso WHERE numero = p_numero)
  ) THEN
    RETURN true;
  END IF;

  IF coalesce(cardinality(v_departamentos), 0) = 0 THEN
    RETURN false;
  END IF;

  SELECT id, departamento, tipo_contrato
    INTO v_new_id, v_new_department, v_contract
    FROM public.nuevo_ingreso WHERE numero = p_numero LIMIT 1;
  SELECT id, departamento
    INTO v_employee_id, v_employee_department
    FROM public.employees WHERE numero = p_numero LIMIT 1;

  -- A current trial contract wins over an older copy in employees.
  IF v_new_id IS NOT NULL AND v_contract IS DISTINCT FROM 'Indeterminado' THEN
    v_department := v_new_department;
  ELSIF v_employee_id IS NOT NULL THEN
    v_department := v_employee_department;
  ELSE
    v_department := v_new_department;
  END IF;

  IF nullif(public.evaluator_normalize_department(v_department), '') IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM unnest(v_departamentos) AS grant_department
    WHERE public.evaluator_normalize_department(grant_department)
      = public.evaluator_normalize_department(v_department)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_evaluate_employee(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_evaluate_employee(text) TO authenticated;

-- The same scope must apply to lists, direct employee-number queries, saved
-- evaluations and inserts. UI filtering alone cannot protect these records.
DROP POLICY IF EXISTS employees_select ON public.employees;
CREATE POLICY employees_select ON public.employees
  FOR SELECT TO authenticated
  USING (public.can_evaluate_employee(numero));

DROP POLICY IF EXISTS nuevo_ingreso_select ON public.nuevo_ingreso;
CREATE POLICY nuevo_ingreso_select ON public.nuevo_ingreso
  FOR SELECT TO authenticated
  USING (public.can_evaluate_employee(numero));

DROP POLICY IF EXISTS evaluaciones_desempeno_select ON public.evaluaciones_desempeno;
CREATE POLICY evaluaciones_desempeno_select ON public.evaluaciones_desempeno
  FOR SELECT TO authenticated
  USING (public.can_evaluate_employee(numero_empleado));

DROP POLICY IF EXISTS incidencias_select ON public.incidencias;
CREATE POLICY incidencias_select ON public.incidencias
  FOR SELECT TO authenticated
  USING (public.can_evaluate_employee(numero_empleado));

DROP POLICY IF EXISTS incidencias_insert ON public.incidencias;
CREATE POLICY incidencias_insert ON public.incidencias
  FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'dev');
DROP POLICY IF EXISTS incidencias_update ON public.incidencias;
CREATE POLICY incidencias_update ON public.incidencias
  FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'dev')
  WITH CHECK (public.get_my_role() = 'dev');
DROP POLICY IF EXISTS incidencias_delete ON public.incidencias;
CREATE POLICY incidencias_delete ON public.incidencias
  FOR DELETE TO authenticated USING (public.get_my_role() = 'dev');

DROP POLICY IF EXISTS desempeno_entregas_select ON public.desempeno_entregas;
CREATE POLICY desempeno_entregas_select ON public.desempeno_entregas
  FOR SELECT TO authenticated
  USING (public.can_evaluate_employee(numero_empleado));

DROP POLICY IF EXISTS employee_courses_select ON public.employee_courses;
CREATE POLICY employee_courses_select ON public.employee_courses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = employee_id AND public.can_evaluate_employee(numero)
  ));

ALTER TABLE public.evaluaciones_desempeno
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS evaluaciones_desempeno_created_by_idx
  ON public.evaluaciones_desempeno (created_by_user_id);

DROP POLICY IF EXISTS evaluaciones_desempeno_insert ON public.evaluaciones_desempeno;
CREATE POLICY evaluaciones_desempeno_insert ON public.evaluaciones_desempeno
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('dev', 'evaluador')
    AND public.can_evaluate_employee(numero_empleado)
    AND (public.get_my_role() = 'dev' OR created_by_user_id = auth.uid())
    AND public.desempeno_es_elegible_periodo(periodo, numero_empleado)
  );

DROP POLICY IF EXISTS evaluaciones_desempeno_update ON public.evaluaciones_desempeno;
CREATE POLICY evaluaciones_desempeno_update ON public.evaluaciones_desempeno
  FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'dev')
  WITH CHECK (
    public.get_my_role() = 'dev'
    AND public.desempeno_es_elegible_periodo(periodo, numero_empleado)
  );

DROP POLICY IF EXISTS evaluaciones_desempeno_delete ON public.evaluaciones_desempeno;
CREATE POLICY evaluaciones_desempeno_delete ON public.evaluaciones_desempeno
  FOR DELETE TO authenticated USING (public.get_my_role() = 'dev');
