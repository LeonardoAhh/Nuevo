-- Add evaluacion_desempeno column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS evaluacion_desempeno TEXT;

