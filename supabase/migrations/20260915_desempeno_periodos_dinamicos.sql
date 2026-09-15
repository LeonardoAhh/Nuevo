-- Alinea la elegibilidad semestral con la aplicación:
-- 3 meses de antigüedad y periodos DIC-MAY / JUN-NOV de cualquier año.
-- Conserva las policies y permisos existentes.

CREATE OR REPLACE FUNCTION public.desempeno_es_elegible_periodo(
  p_periodo text,
  p_numero text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_periodo text := upper(regexp_replace(trim(p_periodo), '\s*-\s*', '-', 'g'));
  v_year integer;
  v_fecha_fin date;
  v_cutoff date;
  v_fecha_ingreso date;
BEGIN
  IF v_periodo !~ '^(DIC-MAY|JUN-NOV) [0-9]{4}$' THEN
    RETURN true;
  END IF;

  v_year := substring(v_periodo from '([0-9]{4})$')::integer;
  v_fecha_fin := CASE
    WHEN v_periodo LIKE 'DIC-MAY %' THEN make_date(v_year, 5, 31)
    ELSE make_date(v_year, 11, 30)
  END;
  v_cutoff := (v_fecha_fin - INTERVAL '3 months')::date;

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

  RETURN v_fecha_ingreso IS NOT NULL AND v_fecha_ingreso <= v_cutoff;
END;
$$;

GRANT EXECUTE ON FUNCTION public.desempeno_es_elegible_periodo(text, text)
  TO authenticated;
