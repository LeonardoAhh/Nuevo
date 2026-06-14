import { toast } from 'sonner';
import { CheckCircle2, XCircle, Info, AlertTriangle, LogOut, Hand, WifiOff } from 'lucide-react';
import React from 'react';

/* ============================================================
   NOTIFY — Notificaciones cohesivas (wrapper sobre sonner)
   ------------------------------------------------------------
   API:
     notify.success(msg, { description, duration })
     notify.error  (msg, { description, duration })
     notify.info   (msg, opts)
     notify.warning(msg, opts)
     notify.loading(msg, opts)        → devuelve id
     notify.dismiss(id)
     notify.promise(promise, { loading, success, error })

   Helpers semánticos:
     notify.welcome(name)
     notify.bye()
     notify.saved(what?)
     notify.deleted(what?)
     notify.created(what?)
     notify.updated(what?)
     notify.networkError(err?)
     notify.copied()
     notify.routeSelected(code)
     notify.routeFinished(code)
   ============================================================ */

const ICON = {
  size: 18,
  strokeWidth: 1.75,
};

const wrapIcon = (Icon, color) => (
  React.createElement('span', {
    style: { display: 'inline-flex', color, flexShrink: 0 },
    'aria-hidden': true,
  }, React.createElement(Icon, { size: ICON.size, strokeWidth: ICON.strokeWidth }))
);

/* Duraciones recomendadas por tipo (ms) */
const DUR = {
  success: 3200,
  info:    3500,
  warning: 4200,
  error:   5000,
  loading: Infinity,
};

const base = (kind) => (msg, opts = {}) => toast[kind](msg, { duration: DUR[kind], ...opts });

export const notify = {
  /* Tipos básicos */
  success: base('success'),
  error:   base('error'),
  info:    base('info'),
  warning: base('warning'),
  message: (msg, opts) => toast(msg, opts),
  loading: (msg, opts = {}) => toast.loading(msg, { duration: DUR.loading, ...opts }),
  dismiss: (id) => toast.dismiss(id),
  promise: toast.promise,

  /* ── Helpers semánticos ──────────────────────────── */
  welcome: (name) => toast.success(
    name ? `Bienvenido, ${String(name).split(' ')[0]}` : 'Bienvenido',
    { description: 'Sesión iniciada correctamente.', icon: wrapIcon(Hand, 'var(--color-accent)'), duration: DUR.success }
  ),

  bye: () => toast(
    'Sesión cerrada',
    { description: 'Hasta pronto.', icon: wrapIcon(LogOut, 'var(--color-muted)'), duration: 2400 }
  ),

  saved: (what = 'Cambios') => toast.success(`${what} guardados`, { duration: DUR.success }),

  created: (what = 'Registro') => toast.success(`${what} creado`, {
    icon: wrapIcon(CheckCircle2, 'var(--color-semantic-success)'),
    duration: DUR.success,
  }),

  updated: (what = 'Registro') => toast.success(`${what} actualizado`, { duration: DUR.success }),

  deleted: (what = 'Registro') => toast.success(`${what} eliminado`, {
    icon: wrapIcon(XCircle, 'var(--color-semantic-error)'),
    duration: DUR.success,
  }),

  networkError: (err) => toast.error('Sin conexión', {
    description: err?.message || 'Comprueba tu internet e inténtalo de nuevo.',
    icon: wrapIcon(WifiOff, 'var(--color-semantic-error)'),
    duration: DUR.error,
  }),

  copied: () => toast.success('Copiado al portapapeles', { duration: 1800 }),

  /* Específicos del dominio */
  routeSelected: (code) => toast.success(`Ruta ${code || ''} lista`, {
    description: 'Ya puedes escanear los códigos QR.',
    duration: DUR.success,
  }),
  routeFinished: (code) => toast(`Ruta ${code || ''} finalizada`, {
    description: 'El historial quedó guardado.',
    duration: 3000,
  }),

  /* Acceso al toast original por si se necesita */
  raw: toast,
};

export { toast };
