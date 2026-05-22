/**
 * Translate a Supabase / Postgres error into a user-facing Spanish message.
 *
 * After PR #39 the database actively rejects writes from non-dev users, so
 * the UI started surfacing raw errors like `"new row violates row-level
 * security policy"` or `"insufficient_privilege"`. This helper maps those
 * onto friendly copy.
 *
 * Accepts any error-shaped value (PostgrestError, Error, unknown) and always
 * returns a string.
 */
export function describeSupabaseError(err: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (!err) return fallback

  const e = err as {
    code?: string
    message?: string
    details?: string
    hint?: string
  }
  const message = (e.message ?? "").toLowerCase()
  const code = e.code ?? ""

  // Role-gated writes — from the profiles_guard_role trigger or RLS.
  if (
    code === "42501" ||
    message.includes("insufficient_privilege") ||
    message.includes("only dev role") ||
    message.includes("row-level security") ||
    message.includes("row level security") ||
    message.includes("violates row-level security")
  ) {
    return "No tienes permisos para hacer este cambio. Contacta al administrador."
  }

  // Unique constraint violations.
  if (code === "23505" || message.includes("duplicate key")) {
    return "Ya existe un registro con esos datos."
  }

  // Foreign-key violations.
  if (code === "23503" || message.includes("foreign key")) {
    return "No se puede eliminar: hay registros relacionados que dependen de este."
  }

  // Not-null violations.
  if (code === "23502" || message.includes("null value")) {
    return "Faltan campos obligatorios."
  }

  // Check-constraint violations.
  if (code === "23514" || message.includes("check constraint")) {
    return "Uno de los valores no cumple con las reglas de validación."
  }

  // Auth errors from Supabase-JS.
  if (message.includes("jwt expired") || message.includes("invalid jwt")) {
    return "Tu sesión expiró. Inicia sesión de nuevo."
  }

  // Network / fetch failures.
  if (message.includes("failed to fetch") || message.includes("networkerror")) {
    return "Sin conexión. Verifica tu internet e inténtalo de nuevo."
  }

  // Known no-rows shape (PGRST116) — generally handled before reaching here,
  // but keep a friendly fallback just in case.
  if (code === "PGRST116") {
    return "No se encontraron resultados."
  }

  return e.message || fallback
}
