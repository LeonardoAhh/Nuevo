import React, { useState } from 'react';
import { QrCode, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import QRCode from 'qrcode';

/* ============================================================
   QR GENERATE MODAL — Generación masiva de QRs
   Cohesivo · 100% tokens · UI/UX semántico
   ============================================================ */
export const QrGenerateModal = ({ onCancel, onComplete }) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState({ current: 0, total: 0 });

  const handleGenerate = async () => {
    setGenerating(true);
    let successCount = 0;

    try {
      const { data: empleados, error: fetchError } = await supabase
        .from('empleados')
        .select('id, numero_empleado');

      if (fetchError) throw fetchError;
      if (!empleados || empleados.length === 0) {
        toast.error('No hay empleados registrados para generar QR.');
        setGenerating(false);
        return;
      }

      setProgress({ current: 0, total: empleados.length });

      for (let i = 0; i < empleados.length; i++) {
        const emp = empleados[i];
        const qrContent = JSON.stringify({ numero_empleado: emp.numero_empleado });
        const qrDataUrl = await QRCode.toDataURL(qrContent, { width: 300, margin: 2 });

        await supabase
          .from('empleados')
          .update({ qr_code: qrDataUrl })
          .eq('id', emp.id);

        successCount++;
        setProgress((p) => ({ ...p, current: p.current + 1 }));
      }

      toast.success(`${successCount} códigos QR generados`);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      toast.error('Error al generar los QR: ' + err.message);
    }

    setGenerating(false);
  };

  const pct = progress.total ? (progress.current / progress.total) * 100 : 0;

  return (
    <div style={S.root} data-testid="qr-modal">
      {/* Intro */}
      <div style={S.intro}>
        <div style={S.introIcon} aria-hidden="true">
          <QrCode size={20} strokeWidth={1.75} />
        </div>
        <p style={S.introTitle}>Generación automática</p>
        <p style={S.introBody}>
          Se generará un código único para cada empleado y se guardará en la base de datos.
        </p>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {generating && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={S.progressWrap}
            data-testid="qr-progress"
          >
            <div style={S.progressHead}>
              <span style={S.progressLabel}>
                Procesando {progress.current} de {progress.total}…
              </span>
              <span style={S.progressPct}>{Math.round(pct)}%</span>
            </div>
            <div style={S.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
              <motion.div
                style={S.barFill}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div style={S.actions}>
        <button
          type="button"
          onClick={onCancel}
          disabled={generating}
          data-testid="qr-modal-cancel"
          style={S.btnSecondary}
        >
          Cancelar
        </button>

        <motion.button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          whileTap={generating ? {} : { scale: 0.985 }}
          aria-busy={generating}
          data-testid="qr-modal-confirm"
          style={{
            ...S.btnPrimary,
            opacity: generating ? 0.65 : 1,
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating
            ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'vp-spin 0.8s linear infinite' }} /> Generando…</>
            : <><CheckCircle size={15} strokeWidth={2} /> Comenzar generación</>
          }
        </motion.button>
      </div>

      <style>{`@keyframes vp-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

const S = {
  root: {
    display: 'flex', flexDirection: 'column',
    gap: 'var(--spacing-lg)',
  },
  intro: {
    border: '1.5px dashed var(--color-hairline-strong)',
    borderRadius: 'var(--rounded-lg)',
    padding: 'var(--spacing-xl) var(--spacing-base)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
  },
  introIcon: {
    width: '2.75rem', height: '2.75rem', borderRadius: '50%',
    background: 'rgb(var(--color-accent-raw) / 0.1)',
    color: 'var(--color-accent)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 'var(--spacing-xxs)',
  },
  introTitle: {
    margin: 0,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    fontWeight: 'var(--typography-title-sm-weight)',
    color: 'var(--color-ink)',
  },
  introBody: {
    margin: 0,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)',
    lineHeight: 'var(--typography-caption-lh)',
    maxWidth: '24rem',
  },

  /* Progress */
  progressWrap: {
    background: 'rgb(var(--color-accent-raw) / 0.04)',
    padding: 'var(--spacing-sm) var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    border: '1px solid rgb(var(--color-accent-raw) / 0.2)',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    gap: 'var(--spacing-xs)',
  },
  progressHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--spacing-xs)',
  },
  progressLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-ink)',
    fontWeight: 500,
  },
  progressPct: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-accent)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  bar: {
    width: '100%',
    height: '0.375rem',
    background: 'var(--color-hairline)',
    borderRadius: 'var(--rounded-pill)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 'inherit',
  },

  /* Actions */
  actions: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    paddingTop: 'var(--spacing-sm)',
    borderTop: '1px solid var(--color-hairline-soft)',
  },
  btnSecondary: {
    flex: 1,
    minHeight: '2.5rem',
    padding: '0 var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    border: '1px solid var(--color-hairline)',
    background: 'transparent',
    color: 'var(--color-ink)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnPrimary: {
    flex: 2,
    minHeight: '2.5rem',
    padding: '0 var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    border: 'none',
    background: 'var(--color-accent)',
    color: 'var(--color-on-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-xs)',
    transition: 'opacity 120ms ease',
  },
};
