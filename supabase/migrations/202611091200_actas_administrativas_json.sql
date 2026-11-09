DELETE FROM public.actas_seguimiento
WHERE tipo = 'PLAN DE SEGUIMIENTO';

ALTER TABLE public.actas_seguimiento
  DROP CONSTRAINT IF EXISTS actas_seguimiento_tipo_check;

ALTER TABLE public.actas_seguimiento
  ADD CONSTRAINT actas_seguimiento_tipo_check
  CHECK (tipo = 'ACTA ADMINISTRATIVA');

CREATE OR REPLACE FUNCTION public.reemplazar_mes_actas_administrativas(
  p_mes text,
  p_registros jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inicio_mes date;
  v_fin_mes date;
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'dev' THEN
    RAISE EXCEPTION 'Solo dev puede importar actas administrativas'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_mes IS NULL OR p_mes !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Mes inválido; usa YYYY-MM'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF jsonb_typeof(p_registros) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Los registros deben ser un arreglo JSON'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_registros) AS item(value)
    WHERE jsonb_typeof(value) IS DISTINCT FROM 'object'
      OR jsonb_typeof(value -> 'numero_empleado') IS DISTINCT FROM 'string'
      OR nullif(btrim(value ->> 'numero_empleado'), '') IS NULL
      OR jsonb_typeof(value -> 'dia') IS DISTINCT FROM 'number'
      OR coalesce(value ->> 'dia', '') !~ '^(?:[1-9]|[12][0-9]|3[01])$'
      OR jsonb_typeof(value -> 'cantidad') IS DISTINCT FROM 'number'
      OR coalesce(value ->> 'cantidad', '') !~ '^[1-9][0-9]{0,9}$'
      OR CASE
        WHEN coalesce(value ->> 'cantidad', '') ~ '^[1-9][0-9]{0,9}$'
          THEN (value ->> 'cantidad')::numeric > 2147483647
        ELSE false
      END
  ) THEN
    RAISE EXCEPTION 'Registro inválido; cada fila requiere empleado, día y cantidad positiva'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_registros)
      AS item(numero_empleado text, dia integer, cantidad integer)
    GROUP BY numero_empleado, dia
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'El archivo contiene días duplicados para un empleado'
      USING ERRCODE = 'unique_violation';
  END IF;

  v_inicio_mes := to_date(p_mes || '-01', 'YYYY-MM-DD');
  v_fin_mes := (v_inicio_mes + interval '1 month')::date;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_registros)
      AS item(numero_empleado text, dia integer, cantidad integer)
    WHERE dia < 1 OR dia > extract(day FROM (v_fin_mes - 1))::integer
  ) THEN
    RAISE EXCEPTION 'El archivo contiene días fuera del mes'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  DELETE FROM public.actas_seguimiento
  WHERE tipo = 'ACTA ADMINISTRATIVA'
    AND fecha >= v_inicio_mes
    AND fecha < v_fin_mes;

  INSERT INTO public.actas_seguimiento (
    numero_empleado,
    tipo,
    fecha,
    descripcion,
    fecha_seguimiento,
    estatus,
    created_by
  )
  SELECT item.numero_empleado,
         'ACTA ADMINISTRATIVA',
         make_date(
           extract(year FROM v_inicio_mes)::integer,
           extract(month FROM v_inicio_mes)::integer,
           item.dia
         ),
         NULL,
         NULL,
         'ACTIVO',
         auth.uid()
  FROM jsonb_to_recordset(p_registros)
    AS item(numero_empleado text, dia integer, cantidad integer)
  CROSS JOIN LATERAL generate_series(1, item.cantidad);
END;
$$;

REVOKE ALL ON FUNCTION public.reemplazar_mes_actas_administrativas(text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reemplazar_mes_actas_administrativas(text, jsonb)
  TO authenticated;
