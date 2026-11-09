CREATE TABLE IF NOT EXISTS public.incumplimientos_reglamento (
  numero_empleado text NOT NULL CHECK (btrim(numero_empleado) <> ''),
  mes text NOT NULL CHECK (mes ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  dia smallint NOT NULL CHECK (dia BETWEEN 1 AND 31),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (numero_empleado, mes, dia)
);

CREATE INDEX IF NOT EXISTS incumplimientos_reglamento_mes_idx
  ON public.incumplimientos_reglamento (mes);

ALTER TABLE public.incumplimientos_reglamento ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.incumplimientos_reglamento FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.incumplimientos_reglamento TO authenticated;

CREATE POLICY incumplimientos_reglamento_select
  ON public.incumplimientos_reglamento
  FOR SELECT TO authenticated
  USING (public.can_evaluate_employee(numero_empleado));

CREATE POLICY incumplimientos_reglamento_insert_dev
  ON public.incumplimientos_reglamento
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'dev');

CREATE POLICY incumplimientos_reglamento_delete_dev
  ON public.incumplimientos_reglamento
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'dev');

CREATE OR REPLACE FUNCTION public.reemplazar_mes_incumplimientos_reglamento(
  p_mes text,
  p_registros jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dias_mes integer;
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'dev' THEN
    RAISE EXCEPTION 'Solo dev puede importar incumplimientos'
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

  v_dias_mes := extract(
    day FROM (
      date_trunc('month', to_date(p_mes || '-01', 'YYYY-MM-DD'))
      + interval '1 month - 1 day'
    )
  )::integer;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_registros)
      AS item(numero_empleado text, dia integer, cantidad integer)
    WHERE dia < 1 OR dia > v_dias_mes
  ) THEN
    RAISE EXCEPTION 'El archivo contiene días fuera del mes'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  DELETE FROM public.incumplimientos_reglamento
  WHERE mes = p_mes;

  INSERT INTO public.incumplimientos_reglamento (
    numero_empleado,
    mes,
    dia,
    cantidad,
    imported_by
  )
  SELECT numero_empleado, p_mes, dia, cantidad, auth.uid()
  FROM jsonb_to_recordset(p_registros)
    AS item(numero_empleado text, dia integer, cantidad integer);
END;
$$;

REVOKE ALL ON FUNCTION public.reemplazar_mes_incumplimientos_reglamento(text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reemplazar_mes_incumplimientos_reglamento(text, jsonb)
  TO authenticated;
