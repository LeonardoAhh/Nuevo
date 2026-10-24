-- El periodo mensual puede contener más de una evaluación de nuevo ingreso.
-- La calificación de cada hito se sincroniza con nuevo_ingreso en la misma
-- transacción que guarda, edita o elimina la evaluación.
BEGIN;

ALTER TABLE public.evaluaciones_desempeno
  ADD COLUMN hito_nuevo_ingreso smallint
  CHECK (hito_nuevo_ingreso BETWEEN 1 AND 3);

CREATE UNIQUE INDEX evaluaciones_desempeno_hito_nuevo_ingreso_unico
  ON public.evaluaciones_desempeno (numero_empleado, hito_nuevo_ingreso)
  WHERE hito_nuevo_ingreso IS NOT NULL;

CREATE FUNCTION public.desempeno_sincronizar_hito_nuevo_ingreso()
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
    RAISE EXCEPTION 'El empleado y el hito de nuevo ingreso no se pueden cambiar';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.hito_nuevo_ingreso IS NULL THEN RETURN OLD; END IF;
    UPDATE public.nuevo_ingreso n SET
      eval_1_calificacion = CASE WHEN OLD.hito_nuevo_ingreso = 1 THEN NULL ELSE n.eval_1_calificacion END,
      eval_2_calificacion = CASE WHEN OLD.hito_nuevo_ingreso = 2 THEN NULL ELSE n.eval_2_calificacion END,
      eval_3_calificacion = CASE WHEN OLD.hito_nuevo_ingreso = 3 THEN NULL ELSE n.eval_3_calificacion END
    WHERE n.numero = OLD.numero_empleado
      AND CASE OLD.hito_nuevo_ingreso
        WHEN 1 THEN n.eval_1_calificacion
        WHEN 2 THEN n.eval_2_calificacion
        WHEN 3 THEN n.eval_3_calificacion
      END = OLD.calificacion_final;
    GET DIAGNOSTICS v_actualizados = ROW_COUNT;
    IF v_actualizados <> 1 THEN
      RAISE EXCEPTION 'La calificacion del seguimiento no coincide con la evaluacion';
    END IF;
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
      RAISE EXCEPTION 'El hito de nuevo ingreso ya se registró o no está programado';
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
      RAISE EXCEPTION 'La calificacion del seguimiento no coincide con la evaluacion';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.desempeno_sincronizar_hito_nuevo_ingreso() FROM PUBLIC;

CREATE TRIGGER trg_desempeno_sincronizar_hito_nuevo_ingreso_insert
AFTER INSERT ON public.evaluaciones_desempeno
FOR EACH ROW EXECUTE FUNCTION public.desempeno_sincronizar_hito_nuevo_ingreso();

CREATE TRIGGER trg_desempeno_sincronizar_hito_nuevo_ingreso_update
AFTER UPDATE OF numero_empleado, hito_nuevo_ingreso, calificacion_final ON public.evaluaciones_desempeno
FOR EACH ROW EXECUTE FUNCTION public.desempeno_sincronizar_hito_nuevo_ingreso();

CREATE TRIGGER trg_desempeno_sincronizar_hito_nuevo_ingreso_delete
AFTER DELETE ON public.evaluaciones_desempeno
FOR EACH ROW EXECUTE FUNCTION public.desempeno_sincronizar_hito_nuevo_ingreso();

COMMIT;
