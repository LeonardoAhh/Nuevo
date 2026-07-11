-- ============================================================
-- Security hardening — restrict mutations on core tables to dev role
-- ============================================================
-- Before this migration every authenticated user (including 'admin'
-- read-only accounts) could insert / update / delete rows in these
-- tables, because the existing policies used WITH CHECK/USING (true).
-- The app's role enforcement lived only in the client (useRole()),
-- which is trivially bypassable from devtools.
--
-- This migration:
--   1. Redefines INSERT/UPDATE/DELETE policies on core tables so only
--      users with profiles.role = 'dev' can mutate them. SELECT stays
--      open to all authenticated users.
--   2. Prevents role-escalation on the profiles table — a user can
--      still update their own profile, but cannot change the `role`
--      column unless they already are 'dev'.
--
-- Uses the `get_my_role()` STABLE SECURITY DEFINER function already
-- installed by 20260416_notifications_improvements.sql.
-- ============================================================

-- ─── Helper: assert the function exists ────────────────────────────
-- (Re-defined here for idempotency in case migrations are replayed
-- out of order.)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;


-- ─── 1. nuevo_ingreso ─────────────────────────────────────────────
DROP POLICY IF EXISTS "nuevo_ingreso_insert" ON nuevo_ingreso;
DROP POLICY IF EXISTS "nuevo_ingreso_update" ON nuevo_ingreso;
DROP POLICY IF EXISTS "nuevo_ingreso_delete" ON nuevo_ingreso;

CREATE POLICY "nuevo_ingreso_insert" ON nuevo_ingreso
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "nuevo_ingreso_update" ON nuevo_ingreso
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "nuevo_ingreso_delete" ON nuevo_ingreso
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');


-- ─── 2. capacitacion (departments / positions / courses / position_courses) ──
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can update departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can delete departments" ON departments;

CREATE POLICY "departments_insert_dev" ON departments
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "departments_update_dev" ON departments
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "departments_delete_dev" ON departments
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "Authenticated users can insert positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can update positions" ON positions;
DROP POLICY IF EXISTS "Authenticated users can delete positions" ON positions;

CREATE POLICY "positions_insert_dev" ON positions
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "positions_update_dev" ON positions
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "positions_delete_dev" ON positions
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "Authenticated users can insert courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can update courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can delete courses" ON courses;

CREATE POLICY "courses_insert_dev" ON courses
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "courses_update_dev" ON courses
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "courses_delete_dev" ON courses
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "Authenticated users can insert position_courses" ON position_courses;
DROP POLICY IF EXISTS "Authenticated users can update position_courses" ON position_courses;
DROP POLICY IF EXISTS "Authenticated users can delete position_courses" ON position_courses;

CREATE POLICY "position_courses_insert_dev" ON position_courses
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "position_courses_update_dev" ON position_courses
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "position_courses_delete_dev" ON position_courses
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');


-- ─── 3. historial (employees / employee_courses / course_aliases) ──
DROP POLICY IF EXISTS "employees_insert" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "employees_delete" ON employees;

CREATE POLICY "employees_insert_dev" ON employees
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "employees_update_dev" ON employees
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "employees_delete_dev" ON employees
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "employee_courses_insert" ON employee_courses;
DROP POLICY IF EXISTS "employee_courses_update" ON employee_courses;
DROP POLICY IF EXISTS "employee_courses_delete" ON employee_courses;

CREATE POLICY "employee_courses_insert_dev" ON employee_courses
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "employee_courses_update_dev" ON employee_courses
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "employee_courses_delete_dev" ON employee_courses
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "course_aliases_insert" ON course_aliases;
DROP POLICY IF EXISTS "course_aliases_update" ON course_aliases;
DROP POLICY IF EXISTS "course_aliases_delete" ON course_aliases;

CREATE POLICY "course_aliases_insert_dev" ON course_aliases
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "course_aliases_update_dev" ON course_aliases
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "course_aliases_delete_dev" ON course_aliases
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');


-- ─── 4. promociones (evaluaciones_desempeño / reglas_promocion) ────
DROP POLICY IF EXISTS "eval_desemp_insert" ON evaluaciones_desempeño;
DROP POLICY IF EXISTS "eval_desemp_update" ON evaluaciones_desempeño;
DROP POLICY IF EXISTS "eval_desemp_delete" ON evaluaciones_desempeño;

CREATE POLICY "eval_desemp_insert_dev" ON evaluaciones_desempeño
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "eval_desemp_update_dev" ON evaluaciones_desempeño
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "eval_desemp_delete_dev" ON evaluaciones_desempeño
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');

DROP POLICY IF EXISTS "reglas_prom_insert" ON reglas_promocion;
DROP POLICY IF EXISTS "reglas_prom_update" ON reglas_promocion;
DROP POLICY IF EXISTS "reglas_prom_delete" ON reglas_promocion;

CREATE POLICY "reglas_prom_insert_dev" ON reglas_promocion
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "reglas_prom_update_dev" ON reglas_promocion
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "reglas_prom_delete_dev" ON reglas_promocion
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');


-- ─── 5. datos_promocion ────────────────────────────────────────────
DROP POLICY IF EXISTS "datos_prom_insert" ON datos_promocion;
DROP POLICY IF EXISTS "datos_prom_update" ON datos_promocion;
DROP POLICY IF EXISTS "datos_prom_delete" ON datos_promocion;

CREATE POLICY "datos_prom_insert_dev" ON datos_promocion
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "datos_prom_update_dev" ON datos_promocion
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "datos_prom_delete_dev" ON datos_promocion
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');


-- ─── 6. reglas_examen ──────────────────────────────────────────────
DROP POLICY IF EXISTS "reglas_examen_insert" ON reglas_examen;
DROP POLICY IF EXISTS "reglas_examen_update" ON reglas_examen;
DROP POLICY IF EXISTS "reglas_examen_delete" ON reglas_examen;

CREATE POLICY "reglas_examen_insert_dev" ON reglas_examen
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'dev');
CREATE POLICY "reglas_examen_update_dev" ON reglas_examen
  FOR UPDATE TO authenticated USING (get_my_role() = 'dev');
CREATE POLICY "reglas_examen_delete_dev" ON reglas_examen
  FOR DELETE TO authenticated USING (get_my_role() = 'dev');


-- ─── 7. profiles — block role escalation ───────────────────────────
-- Previously a user could UPDATE their own profile WITH no WITH CHECK
-- and no column restriction, so they could self-promote to role='dev'.
--
-- New behaviour:
--   * Users can still update their own profile (name, bio, avatar, etc).
--   * The `role` column can only be changed by someone who is already 'dev'.
--   * The check is enforced via a BEFORE UPDATE trigger, which is simpler
--     and more portable than column-level grants.

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.profiles_guard_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF get_my_role() <> 'dev' THEN
      RAISE EXCEPTION 'Only dev role can change the role column'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_role_trg ON profiles;
CREATE TRIGGER profiles_guard_role_trg
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_role();

COMMENT ON TRIGGER profiles_guard_role_trg ON profiles
  IS 'Blocks role escalation — only existing dev users can change profiles.role';
