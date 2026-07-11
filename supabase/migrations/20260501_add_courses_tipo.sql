-- Add tipo column to courses table
-- This column is required by the application code which selects (name, tipo) in joins
-- Default to 'SIN TIPO' so courses not in the mapping return 'SIN TIPO' instead of 'INDUCCIÓN'
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'SIN TIPO';

-- Also add indexes for common queries
CREATE INDEX IF NOT EXISTS courses_tipo_idx ON courses(tipo);

-- Fix existing courses that were incorrectly set to 'INDUCCIÓN' (change to NULL so fallback works)
UPDATE courses SET tipo = NULL WHERE tipo = 'INDUCCIÓN';
