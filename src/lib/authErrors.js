/**
 * authErrors.js — Mapea errores de auth a textos minimalistas y útiles.
 * Mantiene la idea de "una línea, una idea". No expone detalles técnicos.
 */

const MAP = {
  // Errores nativos del navegador / red
  'Failed to fetch':                'Sin conexión',
  'NetworkError when attempting to fetch resource.': 'Sin conexión',
  'Load failed':                    'Sin conexión',

  // Errores comunes de Supabase Auth
  'Invalid login credentials':      'Correo o contraseña incorrectos',
  'Email not confirmed':            'Confirma tu correo primero',
  'User not found':                 'Usuario no encontrado',
  'Invalid email or password':      'Correo o contraseña incorrectos',
  'Email rate limit exceeded':      'Demasiados intentos. Espera un momento',
  'Too many requests':              'Demasiados intentos',
};

/** Devuelve un mensaje corto y amable. Nunca devuelve undefined. */
export const friendlyAuthError = (err) => {
  if (!err) return 'No pudimos iniciar sesión';
  const msg = typeof err === 'string' ? err : err.message;
  if (!msg) return 'No pudimos iniciar sesión';
  if (MAP[msg]) return MAP[msg];

  // Match parcial para variantes
  const lower = msg.toLowerCase();
  if (lower.includes('fetch') || lower.includes('network')) return 'Sin conexión';
  if (lower.includes('credential') || lower.includes('password')) return 'Correo o contraseña incorrectos';
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Demasiados intentos';

  // Si Supabase devolvió un mensaje muy largo, lo recortamos
  return msg.length > 80 ? 'No pudimos iniciar sesión' : msg;
};
