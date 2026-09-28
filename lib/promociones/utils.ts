import type {
  AptitudStatus,
  CursoRequerido,
  EmpleadoPromocion,
  EvaluacionDesempeño,
} from "./types"

/** Puesto habilitado si nombre termina en espacio + letra B-E */
export function isHabilitado(puesto: string): boolean {
  return /\s[B-E]$/i.test(puesto.trim())
}

export function mesesEnPuesto(fechaIngreso: string): number {
  const inicio = new Date(fechaIngreso)
  const hoy = new Date()
  const meses = (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    (hoy.getMonth() - inicio.getMonth())
  return Math.max(0, meses)
}

export function formatMeses(meses: number): string {
  if (meses < 12) return `${meses} mes${meses !== 1 ? "es" : ""}`
  const años = Math.floor(meses / 12)
  const resto = meses % 12
  return resto === 0
    ? `${años} año${años !== 1 ? "s" : ""}`
    : `${años} a${años !== 1 ? "ños" : "ño"} ${resto} mes${resto !== 1 ? "es" : ""}`
}

export function porcentajeCursos(cursos: CursoRequerido[]): number {
  if (cursos.length === 0) return 0
  return Math.round((cursos.filter((c) => c.completado).length / cursos.length) * 100)
}

export function ultimaEvaluacion(evaluaciones: EvaluacionDesempeño[]): EvaluacionDesempeño | undefined {
  if (evaluaciones.length === 0) return undefined
  return [...evaluaciones].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
}

export function calcularAptitud(empleado: EmpleadoPromocion): AptitudStatus {
  const { regla, cursosRequeridos, evaluaciones, fechaIngresoPuesto, calificacionExamen } = empleado
  if (!regla) return "en_revision"

  const fechaDesbloqueo = calcularDesbloqueoExamen(empleado)
  if (fechaDesbloqueo) return "bloqueado_examen"

  const meses = mesesEnPuesto(fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(cursosRequeridos)
  const evalActual = ultimaEvaluacion(evaluaciones)

  if (!evalActual) return "pendiente"

  const fechaExamen = empleado.fechaExamenGuardada ? new Date(empleado.fechaExamenGuardada) : null
  const fechaIngreso = new Date(fechaIngresoPuesto)
  const isExamenValido = fechaExamen && fechaExamen > fechaIngreso

  const cumpleTemporalidad = meses >= regla.minTemporalidadMeses
  const cumpleCursos = pctCursos >= regla.minPorcentajeCursos
  const cumpleEvaluacion = evalActual.calificacion >= regla.minCalificacionEvaluacion
  const cumpleExamen = regla.minCalificacionExamen != null
    ? (isExamenValido && calificacionExamen != null && calificacionExamen >= regla.minCalificacionExamen)
    : true

  if (cumpleTemporalidad && cumpleCursos && cumpleEvaluacion && cumpleExamen) return "apto"
  if (cumpleTemporalidad && cumpleCursos && cumpleEvaluacion && !cumpleExamen) return "pendiente_examen"
  return "no_apto"
}

export function calcularDesbloqueoExamen(empleado: EmpleadoPromocion): Date | null {
  const { regla, intentosExamen, fechaExamenGuardada, calificacionExamen, fechaIngresoPuesto } = empleado
  if (!regla || !regla.minCalificacionExamen) return null
  if (!intentosExamen || intentosExamen === 0 || intentosExamen % 3 !== 0) return null

  // Validar que el examen se tomó después del último cambio de puesto (examen de este ciclo)
  const fechaExamen = fechaExamenGuardada ? new Date(fechaExamenGuardada + "T12:00:00") : null
  const fechaIngreso = new Date(fechaIngresoPuesto + "T12:00:00")
  if (!fechaExamen || fechaExamen <= fechaIngreso) return null
  
  // Si aprobó, no hay bloqueo
  if (calificacionExamen != null && calificacionExamen >= regla.minCalificacionExamen) return null

  const fechaDesbloqueo = new Date(fechaExamen)
  fechaDesbloqueo.setMonth(fechaDesbloqueo.getMonth() + 4)
  
  const hoy = new Date()
  if (hoy < fechaDesbloqueo) {
    return fechaDesbloqueo
  }
  return null
}
