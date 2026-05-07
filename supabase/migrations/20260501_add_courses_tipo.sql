-- Add tipo column to courses table
-- This column is required by the application code which selects (name, tipo) in joins
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'INDUCCIÓN';

-- Also add indexes for common queries
CREATE INDEX IF NOT EXISTS courses_tipo_idx ON courses(tipo);
