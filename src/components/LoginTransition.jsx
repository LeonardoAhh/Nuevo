import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../lib/useReducedMotion';

/* ============================================================
   LoginTransition — Animación minimalista de entrada al dashboard
   ------------------------------------------------------------
   Objetivos:
     • Texto mínimo (saludo corto, sin descripciones).
     • Mark único (check geométrico, sin anillos ni dots).
     • Duración total ≤ 1.2 s (no entorpece el flujo).
     • Respeta `prefers-reduced-motion`.
     • Mobile-first, tokens 100%.
   ============================================================ */

const TRANSITION_TOTAL_MS = 1200; // Visible total
export const LOGIN_TRANSITION_MS = TRANSITION_TOTAL_MS;

const EASE = [0.22, 1, 0.36, 1];

export const LoginTransition = ({ isVisible, userName = '' }) => {
  const reducedMotion = useReducedMotion();
  const firstName = userName ? String(userName).trim().split(/\s+/)[0] : '';
  const greeting = firstName ? `Hola, ${firstName}` : 'Bienvenido';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={greeting}
          data-testid="login-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.28, ease: EASE }}
          style={S.overlay}
        >
          <motion.div
            initial={reducedMotion ? false : { y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: EASE, delay: 0.04 }}
            style={S.core}
          >
            <Mark reducedMotion={reducedMotion} />

            <h2 style={S.greeting} aria-hidden="true">
              {greeting}
            </h2>

            <Progress reducedMotion={reducedMotion} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Mark geométrico ─────────────────────────────────────── */
const Mark = ({ reducedMotion }) => {
  const dur = reducedMotion ? 0.001 : 0.5;
  return (
    <motion.svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <motion.circle
        cx="28"
        cy="28"
        r="24"
        fill="none"
        stroke="rgb(var(--color-accent-raw) / 0.35)"
        strokeWidth="1.5"
        initial={reducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, ease: EASE }}
      />
      <motion.path
        d="M 18 29 L 25 36 L 39 22"
        fill="none"
        stroke="rgb(var(--color-accent-raw))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur * 0.7, ease: EASE, delay: dur * 0.6 }}
      />
    </motion.svg>
  );
};

/* ─── Barra de progreso lineal (consume el tiempo restante) ─ */
const Progress = ({ reducedMotion }) => (
  <div
    style={S.progressTrack}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label="Cargando"
  >
    <motion.div
      initial={{ width: '0%' }}
      animate={{ width: '100%' }}
      transition={{
        duration: reducedMotion ? 0.01 : (TRANSITION_TOTAL_MS - 320) / 1000,
        ease: 'linear',
        delay: 0.2,
      }}
      style={S.progressFill}
    />
  </div>
);

/* ─── Styles ──────────────────────────────────────────────── */
const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'var(--color-canvas)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop:    'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft:   'max(var(--spacing-lg), env(safe-area-inset-left))',
    paddingRight:  'max(var(--spacing-lg), env(safe-area-inset-right))',
  },
  core: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-base)',
    maxWidth: 'min(92vw, 18rem)',
  },
  greeting: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(var(--typography-title-md-size), 5.5vw, var(--typography-display-sm-size))',
    fontWeight: 'var(--typography-title-md-weight)',
    color: 'var(--color-ink)',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    maxWidth: '8rem',
    height: '2px',
    background: 'rgb(var(--color-accent-raw) / 0.15)',
    borderRadius: 'var(--rounded-pill)',
    overflow: 'hidden',
    marginTop: 'var(--spacing-xs)',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 'inherit',
  },
};
