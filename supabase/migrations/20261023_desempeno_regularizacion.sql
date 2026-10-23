-- Captura tardía independiente. El primer semestre exigible es el primer
-- periodo semestral ya registrado en evaluaciones_desempeno.

CREATE TABLE public.evaluaciones_desempeno_tardias (
  evaluacion_id uuid PRIMARY KEY REFERENCES public.evaluaciones_desempeno(id),
  numero_empleado text NOT NULL,
  periodo text NOT NULL,
  fecha_real date NOT NULL,
  motivo text NOT NULL CHECK (btrim(motivo) <> ''),
  autorizado_por uuid NOT NULL REFERENCES auth.users(id),
  registrado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (numero_empleado, periodo)
);

ALTER TABLE public.evaluaciones_desempeno_tardias ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.evaluaciones_desempeno_tardias TO authenticated;
CREATE POLICY evaluaciones_desempeno_tardias_select
  ON public.evaluaciones_desempeno_tardias
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('admin', 'dev'));

CREATE OR REPLACE FUNCTION public.desempeno_regularizacion_pendientes()
RETURNS TABLE (
  numero text,
  nombre text,
  puesto text,
  periodo text,
  fecha_limite date,
  origen text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
BEGIN
  IF auth.uid() IS NULL OR coalesce(public.get_my_role(), '') NOT IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Acceso no autorizado a regularización'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH meses AS (
    SELECT ARRAY['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']::text[] AS nombres
  ),
  primer_semestre AS (
    SELECT min(
      CASE WHEN p.periodo_normalizado LIKE 'DIC-MAY %'
        THEN make_date(right(p.periodo_normalizado, 4)::integer, 5, 31)
        ELSE make_date(right(p.periodo_normalizado, 4)::integer, 11, 30)
      END
    ) AS fecha_cierre
    FROM (
      SELECT upper(regexp_replace(regexp_replace(btrim(e.periodo), '[[:space:]]*-[[:space:]]*', '-', 'g'), '[[:space:]]+', ' ', 'g')) AS periodo_normalizado
      FROM public.evaluaciones_desempeno e
      WHERE e.periodo IS NOT NULL
    ) p
    WHERE p.periodo_normalizado ~ '^(DIC-MAY|JUN-NOV) [0-9]{4}$'
  ),
  mensuales AS (
    SELECT n.numero, n.nombre, coalesce(n.puesto, '') AS puesto,
      m.nombres[CASE WHEN extract(month FROM plazo.fecha)::integer = 1 THEN 12 ELSE extract(month FROM plazo.fecha)::integer - 1 END]
        || '-' || m.nombres[extract(month FROM plazo.fecha)::integer]
        || ' ' || extract(year FROM plazo.fecha)::integer AS periodo,
      plazo.fecha AS fecha_limite,
      'nuevo_ingreso'::text AS origen
    FROM public.nuevo_ingreso n
    CROSS JOIN meses m
    CROSS JOIN LATERAL (VALUES
      (n.eval_1_fecha, n.eval_1_calificacion),
      (n.eval_2_fecha, n.eval_2_calificacion),
      (n.eval_3_fecha, n.eval_3_calificacion)
    ) AS plazo(fecha, calificacion)
    WHERE n.numero IS NOT NULL
      AND n.tipo_contrato IS DISTINCT FROM 'Indeterminado'
      AND plazo.calificacion IS NULL
      AND plazo.fecha < v_hoy
  ),
  semestrales AS (
    SELECT e.numero, e.nombre, coalesce(e.puesto, '') AS puesto,
      tramo.etiqueta || ' ' || anos.anio AS periodo,
      tramo.fecha_limite,
      'planta'::text AS origen
    FROM public.employees e
    CROSS JOIN primer_semestre inicio
    CROSS JOIN LATERAL generate_series(
      extract(year FROM inicio.fecha_cierre)::integer,
      extract(year FROM v_hoy)::integer
    ) AS anos(anio)
    CROSS JOIN LATERAL (VALUES
      ('DIC-MAY'::text, make_date(anos.anio, 5, 31), make_date(anos.anio, 6, 15)),
      ('JUN-NOV'::text, make_date(anos.anio, 11, 30), make_date(anos.anio + 1, 1, 15))
    ) AS tramo(etiqueta, fecha_cierre, fecha_limite)
    WHERE e.numero IS NOT NULL
      AND tramo.fecha_cierre >= inicio.fecha_cierre
      AND tramo.fecha_limite < v_hoy
      AND public.desempeno_es_elegible_periodo(tramo.etiqueta || ' ' || anos.anio, e.numero)
      AND NOT EXISTS (
        SELECT 1 FROM public.nuevo_ingreso n
        WHERE n.numero = e.numero AND n.tipo_contrato IS DISTINCT FROM 'Indeterminado'
      )
  ),
  candidatas AS (
    SELECT * FROM mensuales
    UNION ALL
    SELECT * FROM semestrales
  ),
  unicas AS (
    SELECT DISTINCT ON (c.numero, c.periodo)
      c.numero, c.nombre, c.puesto, c.periodo, c.fecha_limite, c.origen
    FROM candidatas c
    ORDER BY c.numero, c.periodo, c.fecha_limite
  )
  SELECT c.numero, c.nombre, c.puesto, c.periodo, c.fecha_limite, c.origen
  FROM unicas c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.evaluaciones_desempeno guardada
    WHERE guardada.numero_empleado = c.numero
      AND upper(regexp_replace(regexp_replace(btrim(guardada.periodo), '[[:space:]]*-[[:space:]]*', '-', 'g'), '[[:space:]]+', ' ', 'g')) = c.periodo
  )
  ORDER BY c.fecha_limite, c.nombre, c.periodo;
END;
$$;

REVOKE ALL ON FUNCTION public.desempeno_regularizacion_pendientes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.desempeno_regularizacion_pendientes() TO authenticated;

CREATE OR REPLACE FUNCTION public.desempeno_guardar_regularizacion(
  p_evaluacion jsonb,
  p_fecha_real date,
  p_motivo text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_numero text := nullif(btrim(p_evaluacion->>'numero_empleado'), '');
  v_periodo text := upper(regexp_replace(regexp_replace(btrim(p_evaluacion->>'periodo'), '[[:space:]]*-[[:space:]]*', '-', 'g'), '[[:space:]]+', ' ', 'g'));
  v_id uuid;
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
BEGIN
  IF auth.uid() IS NULL OR coalesce(public.get_my_role(), '') NOT IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Acceso no autorizado a regularización'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_numero IS NULL OR v_periodo IS NULL OR nullif(btrim(p_motivo), '') IS NULL
    OR p_fecha_real IS NULL OR p_fecha_real > v_hoy THEN
    RAISE EXCEPTION 'Número, periodo, fecha real y motivo son obligatorios';
  END IF;
  IF jsonb_typeof(p_evaluacion->'objetivos') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_evaluacion->'cumplimiento_responsabilidades') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_evaluacion->'competencias') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_evaluacion->'objetivos') = 0
    OR jsonb_array_length(p_evaluacion->'cumplimiento_responsabilidades') = 0
    OR jsonb_array_length(p_evaluacion->'competencias') = 0
    OR nullif(btrim(p_evaluacion->>'evaluador_nombre'), '') IS NULL
    OR (p_evaluacion->>'tipo') NOT IN ('operativo', 'administrativo', 'jefe')
    OR (p_evaluacion->>'calificacion_final')::integer NOT BETWEEN 0 AND 100 THEN
    RAISE EXCEPTION 'La evaluación está incompleta o contiene datos inválidos';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_numero || ':' || v_periodo, 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.desempeno_regularizacion_pendientes() pendiente
    WHERE pendiente.numero = v_numero AND pendiente.periodo = v_periodo
  ) THEN
    RAISE EXCEPTION 'El periodo ya está guardado o no está vencido';
  END IF;

  INSERT INTO public.evaluaciones_desempeno (
    numero_empleado, evaluador_nombre, evaluador_puesto, tipo, periodo,
    objetivos, cumplimiento_responsabilidades, competencias, compromisos,
    fecha_revision, observaciones, calificacion_final, created_by_user_id
  ) VALUES (
    v_numero, btrim(p_evaluacion->>'evaluador_nombre'), nullif(btrim(p_evaluacion->>'evaluador_puesto'), ''),
    p_evaluacion->>'tipo', v_periodo,
    p_evaluacion->'objetivos', p_evaluacion->'cumplimiento_responsabilidades', p_evaluacion->'competencias',
    nullif(btrim(p_evaluacion->>'compromisos'), ''),
    to_char(p_fecha_real, 'DD/MM/YYYY'), nullif(btrim(p_evaluacion->>'observaciones'), ''),
    (p_evaluacion->>'calificacion_final')::integer, auth.uid()
  ) RETURNING id INTO v_id;

  INSERT INTO public.evaluaciones_desempeno_tardias (
    evaluacion_id, numero_empleado, periodo, fecha_real, motivo, autorizado_por
  ) VALUES (v_id, v_numero, v_periodo, p_fecha_real, btrim(p_motivo), auth.uid());

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.desempeno_guardar_regularizacion(jsonb, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.desempeno_guardar_regularizacion(jsonb, date, text) TO authenticated;
