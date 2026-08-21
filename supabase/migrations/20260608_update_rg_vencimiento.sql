-- Migración para recalcular la fecha_vencimiento_rg de empleados existentes
-- CALIDAD = 7 días
-- RESTO = 60 días

-- 1. Actualizamos todos los registros de 'CALIDAD'
UPDATE public.nuevo_ingreso
SET fecha_vencimiento_rg = fecha_ingreso + 7
WHERE UPPER(TRIM(departamento)) = 'CALIDAD' 
  AND fecha_ingreso IS NOT NULL;

-- 2. Actualizamos el resto de departamentos
UPDATE public.nuevo_ingreso
SET fecha_vencimiento_rg = fecha_ingreso + 60
WHERE (UPPER(TRIM(departamento)) != 'CALIDAD' OR departamento IS NULL) 
  AND fecha_ingreso IS NOT NULL;
