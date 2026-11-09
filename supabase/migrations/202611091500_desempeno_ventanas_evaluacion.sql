BEGIN;

CREATE OR REPLACE FUNCTION public.desempeno_regularizacion_pendientes()
RETURNS TABLE (
  numero text,
  nombre text,
  puesto text,
  periodo text,
  fecha_limite date,
  origen text,
  hito_nuevo_ingreso smallint
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
      'nuevo_ingreso'::text AS origen,
      plazo.hito AS hito_nuevo_ingreso
    FROM public.nuevo_ingreso n
    CROSS JOIN meses m
    CROSS JOIN LATERAL (VALUES
      (n.eval_1_fecha, n.eval_1_calificacion, 1::smallint),
      (n.eval_2_fecha, n.eval_2_calificacion, 2::smallint),
      (n.eval_3_fecha, n.eval_3_calificacion, 3::smallint)
    ) AS plazo(fecha, calificacion, hito)
    WHERE n.numero IS NOT NULL
      AND n.tipo_contrato IS DISTINCT FROM 'Indeterminado'
      AND plazo.calificacion IS NULL
      AND plazo.fecha < v_hoy - CASE WHEN plazo.hito IN (1, 2) THEN 1 ELSE 0 END
  ),
  semestrales AS (
    SELECT e.numero, e.nombre, coalesce(e.puesto, '') AS puesto,
      tramo.etiqueta || ' ' || anos.anio AS periodo,
      tramo.fecha_limite,
      'planta'::text AS origen,
      NULL::smallint AS hito_nuevo_ingreso
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
    SELECT DISTINCT ON (c.numero, c.periodo, c.hito_nuevo_ingreso)
      c.numero, c.nombre, c.puesto, c.periodo, c.fecha_limite, c.origen, c.hito_nuevo_ingreso
    FROM candidatas c
    ORDER BY c.numero, c.periodo, c.hito_nuevo_ingreso, c.fecha_limite
  )
  SELECT c.numero, c.nombre, c.puesto, c.periodo, c.fecha_limite, c.origen, c.hito_nuevo_ingreso
  FROM unicas c
  WHERE c.hito_nuevo_ingreso IS NOT NULL OR NOT EXISTS (
    SELECT 1 FROM public.evaluaciones_desempeno guardada
    WHERE guardada.numero_empleado = c.numero
      AND upper(regexp_replace(regexp_replace(btrim(guardada.periodo), '[[:space:]]*-[[:space:]]*', '-', 'g'), '[[:space:]]+', ' ', 'g')) = c.periodo
  )
  ORDER BY c.fecha_limite, c.nombre, c.periodo, c.hito_nuevo_ingreso;
END;
$$;

CREATE OR REPLACE FUNCTION public.desempeno_sincronizar_hito_nuevo_ingreso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actualizados integer;
BEGIN
  IF TG_OP = 'UPDATE'
    AND (NEW.hito_nuevo_ingreso IS DISTINCT FROM OLD.hito_nuevo_ingreso
      OR (OLD.hito_nuevo_ingreso IS NOT NULL
        AND NEW.numero_empleado IS DISTINCT FROM OLD.numero_empleado)) THEN
    RAISE EXCEPTION 'La evaluación y el empleado no se pueden cambiar';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.hito_nuevo_ingreso IS NULL THEN RETURN OLD; END IF;
    UPDATE public.nuevo_ingreso n SET
      eval_1_calificacion = CASE WHEN OLD.hito_nuevo_ingreso = 1 THEN NULL ELSE n.eval_1_calificacion END,
      eval_2_calificacion = CASE WHEN OLD.hito_nuevo_ingreso = 2 THEN NULL ELSE n.eval_2_calificacion END,
      eval_3_calificacion = CASE WHEN OLD.hito_nuevo_ingreso = 3 THEN NULL ELSE n.eval_3_calificacion END
    WHERE n.numero = OLD.numero_empleado;
    RETURN OLD;
  END IF;

  IF NEW.hito_nuevo_ingreso IS NULL THEN RETURN NEW; END IF;
  IF NEW.calificacion_final IS NULL OR NEW.calificacion_final NOT BETWEEN 0 AND 100 THEN
    RAISE EXCEPTION 'La calificación de nuevo ingreso debe estar entre 0 y 100';
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE public.nuevo_ingreso n SET
      eval_1_calificacion = CASE WHEN NEW.hito_nuevo_ingreso = 1 THEN NEW.calificacion_final ELSE n.eval_1_calificacion END,
      eval_2_calificacion = CASE WHEN NEW.hito_nuevo_ingreso = 2 THEN NEW.calificacion_final ELSE n.eval_2_calificacion END,
      eval_3_calificacion = CASE WHEN NEW.hito_nuevo_ingreso = 3 THEN NEW.calificacion_final ELSE n.eval_3_calificacion END
    WHERE n.numero = NEW.numero_empleado
      AND n.tipo_contrato IS DISTINCT FROM 'Indeterminado'
      AND CASE NEW.hito_nuevo_ingreso
        WHEN 1 THEN n.eval_1_fecha IS NOT NULL AND n.eval_1_calificacion IS NULL
        WHEN 2 THEN n.eval_2_fecha IS NOT NULL AND n.eval_2_calificacion IS NULL
        WHEN 3 THEN n.eval_3_fecha IS NOT NULL AND n.eval_3_calificacion IS NULL
      END;
    GET DIAGNOSTICS v_actualizados = ROW_COUNT;
    IF v_actualizados <> 1 THEN
      RAISE EXCEPTION 'La evaluación de nuevo ingreso ya se registró o no está programada';
    END IF;
  ELSE
    UPDATE public.nuevo_ingreso n SET
      eval_1_calificacion = CASE WHEN NEW.hito_nuevo_ingreso = 1 THEN NEW.calificacion_final ELSE n.eval_1_calificacion END,
      eval_2_calificacion = CASE WHEN NEW.hito_nuevo_ingreso = 2 THEN NEW.calificacion_final ELSE n.eval_2_calificacion END,
      eval_3_calificacion = CASE WHEN NEW.hito_nuevo_ingreso = 3 THEN NEW.calificacion_final ELSE n.eval_3_calificacion END
    WHERE n.numero = NEW.numero_empleado
      AND CASE NEW.hito_nuevo_ingreso
        WHEN 1 THEN n.eval_1_calificacion
        WHEN 2 THEN n.eval_2_calificacion
        WHEN 3 THEN n.eval_3_calificacion
      END = OLD.calificacion_final;
    GET DIAGNOSTICS v_actualizados = ROW_COUNT;
    IF v_actualizados <> 1 THEN
      RAISE EXCEPTION 'La calificación del seguimiento no coincide con la evaluación';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
