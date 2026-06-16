import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * AuthError — Mensaje de error inline, semántico y cohesivo.
 *
 * Reemplaza el `errorStyle` duplicado en Login.jsx y ChoferLogin.jsx.
 * - `role="alert"` para lectores de pantalla (anuncio inmediato).
 * - `aria-live="assertive"` redundante por compatibilidad.
 * - Estilo 100% tokens, sin valores hardcoded.
 * - Mínimo visual: icono + texto, sin saturar.
 */
export const AuthError = ({ children, testId = 'auth-error' }) => {
  if (!children) return null;
  return (
    <div role="alert" aria-live="assertive" data-testid={testId} style={S.box}>
      <AlertCircle
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        style={{ color: 'var(--color-semantic-error)', flexShrink: 0 }}
      />
      <span style={S.text}>{children}</span>
    </div>
  );
};

const S = {
  box: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    background: 'rgb(var(--color-semantic-error-raw) / 0.06)',
    border: '1px solid rgb(var(--color-semantic-error-raw) / 0.22)',
    borderRadius: 'var(--rounded-md)',
  },
  text: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    lineHeight: 1.45,
    color: 'var(--color-semantic-error)',
  },
};
