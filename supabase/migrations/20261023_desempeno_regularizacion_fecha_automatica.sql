-- La fecha de captura tardía siempre proviene del servidor, en la zona
-- horaria de la empresa. La firma anterior se elimina para impedir fechas
-- proporcionadas por el cliente.
BEGIN;

DROP FUNCTION public.desempeno_guardar_regularizacion(jsonb, date, text);

CREATE FUNCTION public.desempeno_guardar_regularizacion(
  p_evaluacion jsonb,
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
  IF v_numero IS NULL OR v_periodo IS NULL OR nullif(btrim(p_motivo), '') IS NULL THEN
    RAISE EXCEPTION 'Número, periodo y motivo son obligatorios';
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
    to_char(v_hoy, 'DD/MM/YYYY'), nullif(btrim(p_evaluacion->>'observaciones'), ''),
    (p_evaluacion->>'calificacion_final')::integer, auth.uid()
  ) RETURNING id INTO v_id;

  INSERT INTO public.evaluaciones_desempeno_tardias (
    evaluacion_id, numero_empleado, periodo, fecha_real, motivo, autorizado_por
  ) VALUES (v_id, v_numero, v_periodo, v_hoy, btrim(p_motivo), auth.uid());

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.desempeno_guardar_regularizacion(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.desempeno_guardar_regularizacion(jsonb, text) TO authenticated;

-- La edición de evaluaciones ya guardadas no puede cambiar la fecha
-- registrada para una captura tardía.
CREATE FUNCTION public.desempeno_proteger_fecha_regularizacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.fecha_revision IS DISTINCT FROM OLD.fecha_revision
    AND EXISTS (
      SELECT 1 FROM public.evaluaciones_desempeno_tardias tardia
      WHERE tardia.evaluacion_id = OLD.id
    ) THEN
    RAISE EXCEPTION 'La fecha de una captura tardía no se puede modificar';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.desempeno_proteger_fecha_regularizacion() FROM PUBLIC;

CREATE TRIGGER trg_desempeno_proteger_fecha_regularizacion
BEFORE UPDATE OF fecha_revision ON public.evaluaciones_desempeno
FOR EACH ROW EXECUTE FUNCTION public.desempeno_proteger_fecha_regularizacion();

COMMIT;
