-- Elegibilidad por antigüedad para evaluaciones de desempeño semestrales.
--
-- Regla de negocio:
--   Un empleado NO puede ser evaluado en un periodo semestral si tiene menos
--   de 2 meses de antigüedad respecto al CIERRE del periodo.
--   Cutoff = (fecha_fin_periodo) − 2 meses.
--   Si fecha_ingreso > cutoff o es NULL → bloquear insert.
--
-- Periodos no semestrales (mensuales, etc.) no son afectados.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠ AJUSTES FUTUROS:
--   Los valores hardcodeados aquí deben coincidir con:
--     lib/desempeno/elegibilidad.ts → MESES_MIN_ANTIGUEDAD_SEMESTRAL, PERIODO_FIN
--   Si cambias uno, actualizar el otro (o crear nueva migration).
-- ─────────────────────────────────────────────────────────────────────────────

-- Función SECURITY DEFINER: lee employees ignorando RLS para poder evaluar
-- la regla incluso si el caller no tiene permiso de SELECT sobre employees.
CREATE OR REPLACE FUNCTION public.desempeno_es_elegible_periodo(
  p_periodo  text,
  p_numero   text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff         date;
  v_fecha_ingreso  date;
BEGIN
  -- Periodos NO semestrales: siempre elegible.
  IF p_periodo NOT IN ('ENE-JUN 2026', 'JUL-DIC 2026') THEN
    RETURN true;
  END IF;

  -- Cutoff = fin del periodo - 2 meses.
  v_cutoff := CASE p_periodo
    WHEN 'ENE-JUN 2026' THEN (DATE '2026-06-30' - INTERVAL '2 months')::date
    WHEN 'JUL-DIC 2026' THEN (DATE '2026-12-31' - INTERVAL '2 months')::date
  END;

  -- Buscar fecha_ingreso del empleado en employees, fallback a nuevo_ingreso.
  SELECT fecha_ingreso INTO v_fecha_ingreso
  FROM public.employees
  WHERE numero = p_numero
  LIMIT 1;

  IF v_fecha_ingreso IS NULL THEN
    SELECT fecha_ingreso INTO v_fecha_ingreso
    FROM public.nuevo_ingreso
    WHERE numero = p_numero
    LIMIT 1;
  END IF;

  -- Sin fecha_ingreso → NO elegible (regla estricta, dato faltante).
  IF v_fecha_ingreso IS NULL THEN
    RETURN false;
  END IF;

  -- Elegible si ingresó <= cutoff.
  RETURN v_fecha_ingreso <= v_cutoff;
END;
$$;

GRANT EXECUTE ON FUNCTION public.desempeno_es_elegible_periodo(text, text)
  TO authenticated;

-- Reemplazar policy INSERT con check adicional de elegibilidad.
-- (Mantiene la regla previa: solo rol 'dev' puede insertar.)
DROP POLICY IF EXISTS "evaluaciones_desempeno_insert"
  ON public.evaluaciones_desempeno;

CREATE POLICY "evaluaciones_desempeno_insert"
  ON public.evaluaciones_desempeno
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'dev'
    AND public.desempeno_es_elegible_periodo(periodo, numero_empleado)
  );

-- Reemplazar policy UPDATE para que tampoco se pueda actualizar un row a un
-- periodo donde el empleado no es elegible (ej. cambio de periodo en update).
DROP POLICY IF EXISTS "evaluaciones_desempeno_update"
  ON public.evaluaciones_desempeno;

CREATE POLICY "evaluaciones_desempeno_update"
  ON public.evaluaciones_desempeno
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'dev')
  WITH CHECK (
    get_my_role() = 'dev'
    AND public.desempeno_es_elegible_periodo(periodo, numero_empleado)
  );
