-- Tabla de departamentos
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de puestos
CREATE TABLE IF NOT EXISTS positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, department_id)
);

-- Catálogo de cursos
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relación puestos ↔ cursos requeridos
CREATE TABLE IF NOT EXISTS position_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(position_id, course_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS positions_department_id_idx ON positions(department_id);
CREATE INDEX IF NOT EXISTS position_courses_position_id_idx ON position_courses(position_id);
CREATE INDEX IF NOT EXISTS position_courses_course_id_idx ON position_courses(course_id);

-- RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read departments" ON departments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert departments" ON departments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update departments" ON departments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read positions" ON positions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert positions" ON positions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update positions" ON positions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read courses" ON courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert courses" ON courses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update courses" ON courses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read position_courses" ON position_courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert position_courses" ON position_courses
  FOR INSERT TO authenticated WITH CHECK (true);
