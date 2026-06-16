import { toast } from 'sonner';
import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, LogOut, WifiOff } from 'lucide-react';

/* ============================================================
   NOTIFY — Notificaciones cohesivas (wrapper sobre sonner)
   ------------------------------------------------------------
   Filosofía:
     • Texto mínimo. Una idea por toast.
     • Sin descripciones largas — sólo cuando aporten valor real.
     • Duraciones tokenizadas (no más magic numbers en cada call).
     • ARIA: success/info → polite; warning/error → assertive.
     • Iconos coherentes con el sistema de diseño.

   API pública:
     notify.success(msg, opts?)
     notify.error  (msg, opts?)
     notify.info   (msg, opts?)
     notify.warning(msg, opts?)
     notify.loading(msg, opts?)        → id (dismissable)
     notify.dismiss(id?)
     notify.promise(promise, { loading, success, error })
     notify.networkError()             → tono error, mensaje fijo
     notify.bye()                      → cierre de sesión
     notify.copied()                   → confirmación de copiado
   ============================================================ */

/* Duraciones (ms) — alineadas al modelo de UX de sonner. */
export const NOTIFY_DURATIONS = {
  success: 2800,
  info:    3200,
  warning: 4000,
  error:   4800,
  loading: Infinity,
};

const ICON_SIZE = 16;
const ICON_STROKE = 2;

const renderIcon = (Icon, colorVar) =>
  React.createElement(
    'span',
    {
      'aria-hidden': true,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colorVar,
        flexShrink: 0,
      },
    },
    React.createElement(Icon, { size: ICON_SIZE, strokeWidth: ICON_STROKE }),
  );

const ICONS = {
  success: () => renderIcon(CheckCircle2, 'var(--color-semantic-success)'),
  error:   () => renderIcon(XCircle, 'var(--color-semantic-error)'),
  warning: () => renderIcon(AlertTriangle, 'var(--color-semantic-warning)'),
  info:    () => renderIcon(Info, 'var(--color-accent)'),
};

/* Helper interno: lanza un toast tipado con icono y duración por defecto. */
const fire = (kind) => (msg, opts = {}) => toast[kind](msg, {
  duration: NOTIFY_DURATIONS[kind],
  icon: ICONS[kind] ? ICONS[kind]() : undefined,
  ...opts,
});

export const notify = {
  success: fire('success'),
  error:   fire('error'),
  warning: fire('warning'),
  info:    fire('info'),

  /* Texto plano sin tipo (neutro). */
  message: (msg, opts = {}) => toast(msg, { duration: NOTIFY_DURATIONS.info, ...opts }),

  /* Loading persistente — devuelve id para dismiss. */
  loading: (msg, opts = {}) => toast.loading(msg, {
    duration: NOTIFY_DURATIONS.loading,
    ...opts,
  }),

  dismiss: (id) => toast.dismiss(id),

  /* Promise wrapper (toast lifecycle). */
  promise: toast.promise,

  /* ─── Helpers semánticos del dominio ───────────────────────── */

  /** Sesión cerrada — neutro, sin descripción. */
  bye: () => toast('Sesión cerrada', {
    duration: 2200,
    icon: renderIcon(LogOut, 'var(--color-muted)'),
  }),

  /** Copia al portapapeles — confirmación brevísima. */
  copied: () => toast.success('Copiado', {
    duration: 1800,
    icon: ICONS.success(),
  }),

  /** Error de red — texto fijo, sin exponer detalles de err. */
  networkError: () => toast.error('Sin conexión', {
    duration: NOTIFY_DURATIONS.error,
    icon: renderIcon(WifiOff, 'var(--color-semantic-error)'),
  }),

  /* Acceso al toast crudo para casos avanzados. */
  raw: toast,
};

export { toast };
