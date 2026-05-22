-- Agregar columna de rol a profiles
-- Roles: 'dev' (todo), 'admin' (solo lectura)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('dev', 'admin'));

-- Índice para consultas por rol
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
