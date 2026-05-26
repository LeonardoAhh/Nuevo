-- Actualiza la fn `desempeno_es_elegible_periodo` para reflejar los nuevos
-- labels de periodos semestrales: DIC-MAY 2026 y JUN-NOV 2026.
--
-- La migration original (20260526_eval_desempeno_elegibilidad.sql) usaba
-- 'ENE-JUN 2026' / 'JUL-DIC 2026' con fechas fin 2026-06-30 / 2026-12-31.
--
-- Cambios:
--   ENE-JUN 2026 (fin 2026-06-30)  →  DIC-MAY 2026 (fin 2026-05-31)
--   JUL-DIC 2026 (fin 2026-12-31)  →  JUN-NOV 2026 (fin 2026-11-30)
--
-- Cutoff sigue siendo `fecha_fin - 2 meses`. Mantiene SECURITY DEFINER y
-- los mismos contratos con las policies existentes (no hace falta recrear
-- las policies de INSERT/UPDATE en evaluaciones_desempeno).
--
-- ⚠ Estos valores deben coincidir con:
--   lib/desempeno/elegibilidad.ts → PERIODO_FIN
--   lib/catalogo.ts               → PERIODOS_DESEMPENO.semestrales

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
  IF p_periodo NOT IN ('DIC-MAY 2026', 'JUN-NOV 2026') THEN
    RETURN true;
  END IF;

  -- Cutoff = fin del periodo - 2 meses.
  v_cutoff := CASE p_periodo
    WHEN 'DIC-MAY 2026' THEN (DATE '2026-05-31' - INTERVAL '2 months')::date
    WHEN 'JUN-NOV 2026' THEN (DATE '2026-11-30' - INTERVAL '2 months')::date
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
