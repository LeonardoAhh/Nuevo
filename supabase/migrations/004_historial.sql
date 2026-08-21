-- Tabla de empleados
CREATE TABLE IF NOT EXISTS employees (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero       TEXT,
  nombre       TEXT NOT NULL,
  puesto       TEXT,
  departamento TEXT,
  area         TEXT,
  turno        TEXT,
  fecha_ingreso DATE,
  jefe_directo TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nombre)
);

-- Historial de cursos tomados por empleado
CREATE TABLE IF NOT EXISTS employee_courses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_id       UUID REFERENCES courses(id) ON DELETE SET NULL,
  raw_course_name TEXT NOT NULL,
  fecha_aplicacion DATE,
  calificacion    INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, raw_course_name)
);

-- Alias de nombres de cursos para normalización automática
-- Mapea variantes (normalizadas) al curso canónico
CREATE TABLE IF NOT EXISTS course_aliases (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alias      TEXT NOT NULL UNIQUE,  -- nombre normalizado (sin acentos, mayúsculas)
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS employees_nombre_idx         ON employees(nombre);
CREATE INDEX IF NOT EXISTS employee_courses_emp_idx     ON employee_courses(employee_id);
CREATE INDEX IF NOT EXISTS employee_courses_course_idx  ON employee_courses(course_id);
CREATE INDEX IF NOT EXISTS course_aliases_alias_idx     ON course_aliases(alias);

-- RLS
ALTER TABLE employees       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_aliases   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select" ON employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert" ON employees
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employees_update" ON employees
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "employee_courses_select" ON employee_courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_courses_insert" ON employee_courses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employee_courses_update" ON employee_courses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "course_aliases_select" ON course_aliases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_aliases_insert" ON course_aliases
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "course_aliases_update" ON course_aliases
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "employees_delete" ON employees
  FOR DELETE TO authenticated USING (true);
CREATE POLICY "employee_courses_delete" ON employee_courses
  FOR DELETE TO authenticated USING (true);
CREATE POLICY "course_aliases_delete" ON course_aliases
  FOR DELETE TO authenticated USING (true);
