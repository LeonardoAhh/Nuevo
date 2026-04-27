/**
 * Plantillas de formato de examen — encabezado fijo + cuerpo editable +
 * footer con código y revisión. Todas se imprimen en tamaño carta.
 *
 * Encabezado estandarizado (todas las plantillas comparten estos campos):
 *   - Nombre del examen (usa `nombre_examen`)
 *   - Nombre empleado (línea para llenar a mano)
 *   - No. Empleado
 *   - Turno
 *   - Departamento
 *   - Fecha
 *   - Calificación
 */
export interface Formato {
  id: string
  nombre_examen: string
  codigo: string // ej. "RG-ADM-049"
  revision: number // ej. 3 → "Rev. 3"
  cuerpo_html: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface FormatoDraft {
  id?: string
  nombre_examen: string
  codigo: string
  revision: number
  cuerpo_html: string
}

/** Validación rápida en el cliente antes de mandar al server. */
export function validateFormato(d: FormatoDraft): string | null {
  const nombre = d.nombre_examen.trim()
  if (nombre.length < 2 || nombre.length > 200) {
    return "El nombre del examen debe tener entre 2 y 200 caracteres"
  }
  const codigo = d.codigo.trim()
  if (codigo.length < 2 || codigo.length > 50) {
    return "El código debe tener entre 2 y 50 caracteres"
  }
  if (!Number.isInteger(d.revision) || d.revision < 0 || d.revision > 999) {
    return "La revisión debe ser un entero entre 0 y 999"
  }
  if (d.cuerpo_html.length > 200_000) {
    return "El cuerpo del formato excede el tamaño máximo"
  }
  return null
}

export function formatRevision(rev: number): string {
  return `Rev. ${rev}`
}
