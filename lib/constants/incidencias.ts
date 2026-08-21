import type { IncidenciaCategory } from '@/lib/hooks/useIncidencias'

// ─────────────────────────────────────────────────────────────────────────────
// Metadata de categorías de incidencias (colores y etiquetas cortas)
// Fuente única de verdad — importar desde aquí en cualquier componente.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<IncidenciaCategory, { color: string; shortLabel: string }> = {
  'FALTA INJUSTIFICADA': { color: 'text-destructive', shortLabel: 'F. Injust.' },
  'DIA FESTIVO':         { color: 'text-info', shortLabel: 'Festivo' },
  'FALTAS JUST':         { color: 'text-warning', shortLabel: 'F. Just.' },
  'SANCIÓN':             { color: 'text-destructive', shortLabel: 'Sanción' },
  'PERMISO':             { color: 'text-primary', shortLabel: 'Permiso' },
  'CAMBIO TURNO':        { color: 'text-info', shortLabel: 'C. Turno' },
  'INCAPACIDAD':         { color: 'text-warning', shortLabel: 'Incap.' },
  'VACACIÓN':            { color: 'text-success', shortLabel: 'Vacación' },
  'TXT':                 { color: 'text-muted-foreground', shortLabel: 'TXT' },
  'DESCANSO':            { color: 'text-success', shortLabel: 'Descanso' },
  'PERMISO HORAS':       { color: 'text-primary', shortLabel: 'Perm. Hrs' },
}
