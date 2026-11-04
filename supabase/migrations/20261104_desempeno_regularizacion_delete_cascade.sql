-- Deleting a regularized evaluation also deletes its linked late-capture record.
BEGIN;

ALTER TABLE public.evaluaciones_desempeno_tardias
  DROP CONSTRAINT evaluaciones_desempeno_tardias_evaluacion_id_fkey,
  ADD CONSTRAINT evaluaciones_desempeno_tardias_evaluacion_id_fkey
    FOREIGN KEY (evaluacion_id)
    REFERENCES public.evaluaciones_desempeno(id)
    ON DELETE CASCADE;

COMMIT;
