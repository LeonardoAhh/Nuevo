-- Agrega columna fisico_entregado a desempeno_entregas.
-- Permite marcar que el formato impreso fue recibido físicamente,
-- independientemente de si la evaluación fue capturada en sistema (auto).

ALTER TABLE public.desempeno_entregas
  ADD COLUMN IF NOT EXISTS fisico_entregado boolean NOT NULL DEFAULT false;
