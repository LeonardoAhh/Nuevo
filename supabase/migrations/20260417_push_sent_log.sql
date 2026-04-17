-- Tabla para registrar qué push ya se enviaron (evita duplicados diarios)
CREATE TABLE IF NOT EXISTS public.push_sent_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id      text        NOT NULL,   -- ID de la baja o contrato
  ref_type    text        NOT NULL,   -- 'baja' | 'contrato'
  days_before int         NOT NULL,   -- 0 = día exacto, 1, 3 = días de anticipación
  sent_at     date        NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (ref_id, ref_type, days_before, sent_at)
);

-- Sin RLS (solo accede el service role desde el servidor)
ALTER TABLE public.push_sent_log ENABLE ROW LEVEL SECURITY;
