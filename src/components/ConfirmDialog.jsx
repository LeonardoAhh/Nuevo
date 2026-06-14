import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldQuestion } from 'lucide-react';

/**
 * ConfirmDialog — diálogo de confirmación cohesivo y a11y.
 *
 * Props:
 *  - isOpen
 *  - title, message
 *  - confirmText (default "Confirmar"), cancelText (default "Cancelar")
 *  - isDestructive (bool) → CTA en rojo
 *  - onConfirm, onCancel
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText  = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  // Esc para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  const ToneIcon = isDestructive ? AlertTriangle : ShieldQuestion;
  const toneVar  = isDestructive ? 'var(--color-semantic-error)' : 'var(--color-accent)';
  const toneRaw  = isDestructive ? 'var(--color-semantic-error-raw)' : 'var(--color-accent-raw)';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog" aria-modal="true" aria-labelledby="cd-title" aria-describedby="cd-message"
          data-testid="confirm-dialog"
          onClick={onCancel}
          style={S.backdrop}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={S.panel}
          >
            <div style={S.head}>
              <div style={{ ...S.icon, background: `rgb(${toneRaw} / 0.12)`, color: toneVar }} aria-hidden="true">
                <ToneIcon size={18} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 id="cd-title" style={S.title}>{title}</h3>
                <p id="cd-message" style={S.message}>{message}</p>
              </div>
            </div>

            <div style={S.actions}>
              <button
                type="button"
                onClick={onCancel}
                data-testid="confirm-dialog-cancel"
                style={S.btnSecondary}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                data-testid="confirm-dialog-accept"
                style={{
                  ...S.btnPrimary,
                  background: toneVar,
                }}
                autoFocus
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const S = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(15, 18, 30, 0.45)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'var(--spacing-base)',
    zIndex: 99999,
  },
  panel: {
    background: 'var(--color-surface-card)',
    border: '1px solid var(--color-hairline-soft)',
    borderRadius: 'var(--rounded-xl)',
    padding: 'var(--spacing-lg)',
    width: '100%',
    maxWidth: 'min(92vw, 24rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  },
  head: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    alignItems: 'flex-start',
  },
  icon: {
    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--typography-title-sm-size)',
    fontWeight: 'var(--typography-title-md-weight)',
    color: 'var(--color-ink)',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  message: {
    margin: 'var(--spacing-xxs) 0 0',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    color: 'var(--color-muted)',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-sm)',
    flexWrap: 'wrap',
  },
  btnSecondary: {
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
    minHeight: '2.5rem',
    padding: '0 var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    border: 'none',
    color: 'var(--color-on-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
