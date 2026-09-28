import type { EmpleadoPromocion } from "./types"
import {
  calcularAptitud,
  mesesEnPuesto,
  porcentajeCursos,
  ultimaEvaluacion,
} from "./utils"

export function getPromotionRowView(empleado: EmpleadoPromocion) {
  const regla = empleado.regla
  const meses = mesesEnPuesto(empleado.fechaIngresoPuesto)
  const porcentajeCompletado = porcentajeCursos(empleado.cursosRequeridos)
  const evaluacion = ultimaEvaluacion(empleado.evaluaciones)
  const fechaExamen = empleado.fechaExamenGuardada
    ? new Date(`${empleado.fechaExamenGuardada}T12:00:00`)
    : null
  const fechaInicio = new Date(`${empleado.fechaIngresoPuesto}T12:00:00`)
  const examenVigente = !!fechaExamen && fechaExamen > fechaInicio

  return {
    aptitud: calcularAptitud(empleado),
    regla,
    meses,
    porcentajeCompletado,
    cursosCompletados: empleado.cursosRequeridos.filter(curso => curso.completado).length,
    evaluacion,
    cumpleTemporalidad: regla ? meses >= regla.minTemporalidadMeses : null,
    cumpleCursos: regla ? porcentajeCompletado >= regla.minPorcentajeCursos : null,
    cumpleEvaluacion: regla && evaluacion
      ? evaluacion.calificacion >= regla.minCalificacionEvaluacion
      : null,
    cumpleExamen: regla?.minCalificacionExamen != null
      ? examenVigente
        && empleado.calificacionExamen != null
        && empleado.calificacionExamen >= regla.minCalificacionExamen
      : null,
  }
}
