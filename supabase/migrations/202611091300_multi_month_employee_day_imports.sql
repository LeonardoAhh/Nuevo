CREATE OR REPLACE FUNCTION public.validar_importacion_meses_conteos(
  p_periodos jsonb
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_periodo jsonb;
  v_mes text;
  v_inicio_mes date;
  v_dias_mes integer;
BEGIN
  IF jsonb_typeof(p_periodos) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Los periodos deben ser un arreglo JSON con al menos un mes'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF jsonb_array_length(p_periodos) = 0 THEN
    RAISE EXCEPTION 'Los periodos deben ser un arreglo JSON con al menos un mes'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_periodos) AS periodo(value)
    WHERE jsonb_typeof(value) IS DISTINCT FROM 'object'
      OR jsonb_typeof(value -> 'mes') IS DISTINCT FROM 'string'
      OR coalesce(value ->> 'mes', '') !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
      OR jsonb_typeof(value -> 'registros') IS DISTINCT FROM 'array'
  ) THEN
    RAISE EXCEPTION 'Cada periodo requiere mes YYYY-MM y un arreglo de registros'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_periodos) AS periodo(value)
    GROUP BY value ->> 'mes'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'El archivo contiene meses duplicados'
      USING ERRCODE = 'unique_violation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_periodos) AS periodo(value)
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'registros') AS registro(value)
    WHERE jsonb_typeof(registro.value) IS DISTINCT FROM 'object'
      OR jsonb_typeof(registro.value -> 'numero_empleado') IS DISTINCT FROM 'string'
      OR nullif(btrim(registro.value ->> 'numero_empleado'), '') IS NULL
      OR jsonb_typeof(registro.value -> 'dia') IS DISTINCT FROM 'number'
      OR coalesce(registro.value ->> 'dia', '') !~ '^(?:[1-9]|[12][0-9]|3[01])$'
      OR jsonb_typeof(registro.value -> 'cantidad') IS DISTINCT FROM 'number'
      OR coalesce(registro.value ->> 'cantidad', '') !~ '^[1-9][0-9]{0,9}$'
      OR CASE
        WHEN coalesce(registro.value ->> 'cantidad', '') ~ '^[1-9][0-9]{0,9}$'
          THEN (registro.value ->> 'cantidad')::numeric > 2147483647
        ELSE false
      END
  ) THEN
    RAISE EXCEPTION 'Registro inválido; cada fila requiere empleado, día y cantidad positiva'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_periodos) AS periodo(value)
    CROSS JOIN LATERAL jsonb_to_recordset(value -> 'registros')
      AS registro(numero_empleado text, dia integer, cantidad integer)
    GROUP BY value ->> 'mes', registro.numero_empleado, registro.dia
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'El archivo contiene días duplicados para un empleado y mes'
      USING ERRCODE = 'unique_violation';
  END IF;

  FOR v_periodo IN SELECT value FROM jsonb_array_elements(p_periodos) AS periodo(value)
  LOOP
    v_mes := v_periodo ->> 'mes';
    v_inicio_mes := make_date(
      split_part(v_mes, '-', 1)::integer,
      split_part(v_mes, '-', 2)::integer,
      1
    );
    v_dias_mes := extract(day FROM (v_inicio_mes + interval '1 month - 1 day'))::integer;

    IF EXISTS (
      SELECT 1
      FROM jsonb_to_recordset(v_periodo -> 'registros')
        AS registro(numero_empleado text, dia integer, cantidad integer)
      WHERE dia < 1 OR dia > v_dias_mes
    ) THEN
      RAISE EXCEPTION 'El archivo contiene días fuera de %', v_mes
        USING ERRCODE = 'invalid_parameter_value';
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.validar_importacion_meses_conteos(jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reemplazar_meses_incumplimientos_reglamento(
  p_periodos jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'dev' THEN
    RAISE EXCEPTION 'Solo dev puede importar incumplimientos'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM pg_advisory_xact_lock(20261109, 1);
  PERFORM public.validar_importacion_meses_conteos(p_periodos);

  DELETE FROM public.incumplimientos_reglamento
  WHERE mes IN (
    SELECT value ->> 'mes'
    FROM jsonb_array_elements(p_periodos) AS periodo(value)
  );

  INSERT INTO public.incumplimientos_reglamento (
    numero_empleado,
    mes,
    dia,
    cantidad,
    imported_by
  )
  SELECT registro.numero_empleado,
         periodo.value ->> 'mes',
         registro.dia,
         registro.cantidad,
         auth.uid()
  FROM jsonb_array_elements(p_periodos) AS periodo(value)
  CROSS JOIN LATERAL jsonb_to_recordset(periodo.value -> 'registros')
    AS registro(numero_empleado text, dia integer, cantidad integer);
END;
$$;

REVOKE ALL ON FUNCTION public.reemplazar_meses_incumplimientos_reglamento(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reemplazar_meses_incumplimientos_reglamento(jsonb)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.reemplazar_meses_actas_administrativas(
  p_periodos jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'dev' THEN
    RAISE EXCEPTION 'Solo dev puede importar actas administrativas'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM pg_advisory_xact_lock(20261109, 2);
  PERFORM public.validar_importacion_meses_conteos(p_periodos);

  DELETE FROM public.actas_seguimiento AS acta
  WHERE acta.tipo = 'ACTA ADMINISTRATIVA'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_periodos) AS periodo(value)
      WHERE acta.fecha >= make_date(
              split_part(periodo.value ->> 'mes', '-', 1)::integer,
              split_part(periodo.value ->> 'mes', '-', 2)::integer,
              1
            )
        AND acta.fecha < (
              make_date(
                split_part(periodo.value ->> 'mes', '-', 1)::integer,
                split_part(periodo.value ->> 'mes', '-', 2)::integer,
                1
              ) + interval '1 month'
            )::date
    );

  INSERT INTO public.actas_seguimiento (
    numero_empleado,
    tipo,
    fecha,
    descripcion,
    fecha_seguimiento,
    estatus,
    created_by
  )
  SELECT registro.numero_empleado,
         'ACTA ADMINISTRATIVA',
         make_date(
           split_part(periodo.value ->> 'mes', '-', 1)::integer,
           split_part(periodo.value ->> 'mes', '-', 2)::integer,
           registro.dia
         ),
         NULL,
         NULL,
         'ACTIVO',
         auth.uid()
  FROM jsonb_array_elements(p_periodos) AS periodo(value)
  CROSS JOIN LATERAL jsonb_to_recordset(periodo.value -> 'registros')
    AS registro(numero_empleado text, dia integer, cantidad integer)
  CROSS JOIN LATERAL generate_series(1, registro.cantidad) AS acta(numero);
END;
$$;

REVOKE ALL ON FUNCTION public.reemplazar_meses_actas_administrativas(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reemplazar_meses_actas_administrativas(jsonb)
  TO authenticated;
