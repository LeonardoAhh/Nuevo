// ─── Tipos del dominio de promociones ──────────────────────────────────────

export type AptitudStatus = "apto" | "no_apto" | "pendiente" | "en_revision"

export interface CursoRequerido {
  nombre: string
  completado: boolean
  fechaAplicacion?: string
  calificacion?: number
}

export interface ReglaPromocion {
  puesto: string
  promocionA?: string
  minTemporalidadMeses: number
  minCalificacionExamen?: number
  minCalificacionEvaluacion: number
  minPorcentajeCursos: number
  descripcion?: string
}

export interface EvaluacionDesempeño {
  fecha: string
  calificacion: number
  periodo?: string
  evaluador?: string
}

export interface EmpleadoPromocion {
  id: string
  numero?: string
  nombre: string
  puesto: string
  departamento: string
  area?: string
  turno?: string
  fechaIngresoPuesto: string
  fechaExamenGuardada?: string
  calificacionExamen?: number
  intentosExamen?: number
  cursosRequeridos: CursoRequerido[]
  evaluaciones: EvaluacionDesempeño[]
  regla?: ReglaPromocion
}

// ─── Interfaces JSON de importación ────────────────────────────────────────

export interface ReglaPromocionJSON {
  "Puesto Actual": string
  "Promoción a": string
  "Temporalidad (meses)": string
  "Calificación Examen Teorico": string
  "Cumplimiento Cursos Asigandos": string
  "Calificación Evaluación Desempeño": string
}

export interface DatosPromocionJSON {
  "N.N": string
  "Fecha Inicio Puesto": string
  "Desempeño Actual (%)": string
  "Periodo de Evaluación": string
  "Última Calificación Examen (%)": string
  "Intentos de Examen": string
}
