CREATE OR REPLACE FUNCTION public.registrar_incumplimiento_reglamento(
  p_numero_empleado text,
  p_fecha date,
  p_cantidad integer,
  p_cantidad_anterior integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows integer;
  v_mes text;
  v_dia smallint;
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'dev' THEN
    RAISE EXCEPTION 'Solo dev puede capturar incumplimientos'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_numero_empleado IS NULL OR nullif(btrim(p_numero_empleado), '') IS NULL THEN
    RAISE EXCEPTION 'El número de empleado es obligatorio'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_fecha IS NULL THEN
    RAISE EXCEPTION 'La fecha es obligatoria'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad < 1 THEN
    RAISE EXCEPTION 'La cantidad debe ser un entero mayor que cero'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE numero = btrim(p_numero_empleado)
  ) THEN
    RAISE EXCEPTION 'No existe un empleado con el número indicado'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_mes := to_char(p_fecha, 'YYYY-MM');
  v_dia := extract(day FROM p_fecha)::smallint;

  IF p_cantidad_anterior IS NULL THEN
    INSERT INTO public.incumplimientos_reglamento (
      numero_empleado,
      mes,
      dia,
      cantidad,
      imported_by
    )
    VALUES (
      btrim(p_numero_empleado),
      v_mes,
      v_dia,
      p_cantidad,
      auth.uid()
    )
    ON CONFLICT (numero_empleado, mes, dia) DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Ya existe un incumplimiento para esa fecha. Recarga los datos antes de actualizar la cantidad.'
        USING ERRCODE = 'unique_violation';
    END IF;
  ELSE
    IF p_cantidad_anterior < 1 THEN
      RAISE EXCEPTION 'La cantidad registrada previamente no es válida'
        USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE public.incumplimientos_reglamento
    SET cantidad = p_cantidad,
        imported_by = auth.uid()
    WHERE numero_empleado = btrim(p_numero_empleado)
      AND mes = v_mes
      AND dia = v_dia
      AND cantidad = p_cantidad_anterior;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'El registro cambió mientras confirmabas. Recarga los datos y vuelve a validar la cantidad.'
        USING ERRCODE = 'serialization_failure';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_incumplimiento_reglamento(text, date, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_incumplimiento_reglamento(text, date, integer, integer)
  TO authenticated;
