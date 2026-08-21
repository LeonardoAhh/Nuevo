-- ─────────────────────────────────────────────────────────────────────────────
-- Add ausentismo metrics to reportes_diarios
-- dias_disponibles = total_empleados × days_in_month
-- total_ausentismo = count of F + P + I across all employees × all days
-- pct_ausentismo   = (total_ausentismo / dias_disponibles) × 100
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.reportes_diarios
  ADD COLUMN IF NOT EXISTS dias_disponibles  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ausentismo  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ausentismo    NUMERIC(5,2) NOT NULL DEFAULT 0;
