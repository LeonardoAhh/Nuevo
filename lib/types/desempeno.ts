export interface Objetivo {
  numero: number
  descripcion: string
  resultado: string
  porcentaje: string
  comentarios: string
}

export interface CumplimientoItem {
  descripcion: string
  porcentaje: string
  evalua: string
  comentarios: string
}

export interface Competencia {
  nombre: string
  descripcion: string
  calificacion: number // 0-4
  comentarios: string
}

export interface IncidenciaResumen {
  categoria: string
  valor: number | null
  notas: string | null
  mes: string | null
}

export type DesempenoTipo = 'operativo' | 'administrativo' | 'jefe'

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_OBJETIVOS_POR_TIPO: Record<DesempenoTipo, Objetivo[]> = {
  operativo: [
    { numero: 1, descripcion: "Asegurar pesajes correctos y oportunos en cada turno", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Mantener limpieza y orden en la báscula y área de trabajo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 3, descripcion: "Reportar incidencias de peso y calidad conforme a procedimiento", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 4, descripcion: "Cumplir con el 100% de las rutinas de seguridad e higiene", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 5, descripcion: "Apoyar en la recepción de materia prima con tiempos establecidos", resultado: "NA", porcentaje: "NA", comentarios: "" },
  ],
  administrativo: [
    { numero: 1, descripcion: "Gestionar documentación y archivos internos con precisión", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Atender solicitudes de clientes y áreas internas en tiempo y forma", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 3, descripcion: "Mantener actualización de sistemas y registros administrativos", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 4, descripcion: "Colaborar en el cierre de procesos contables y administrativos", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 5, descripcion: "Proponer mejoras en flujo de trabajo y controles administrativos", resultado: "NA", porcentaje: "NA", comentarios: "" },
  ],
  jefe: [
    { numero: 1, descripcion: "Supervisar cumplimiento de metas y calidad del equipo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Motivar y desarrollar al personal a su cargo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 3, descripcion: "Garantizar que las órdenes de trabajo se cumplan en tiempo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 4, descripcion: "Dar seguimiento a incidencias y acciones correctivas", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 5, descripcion: "Comunicar resultados y prioridades al área de dirección", resultado: "NA", porcentaje: "NA", comentarios: "" },
  ],
}

export const DEFAULT_CUMPLIMIENTO: CumplimientoItem[] = [
  { descripcion: "Cumplir compromisos derivados de sus planes de seguimiento por desempeño.", porcentaje: "NA", evalua: "JEFE", comentarios: "" },
  { descripcion: "Cumplir con lineamientos de reglamento interior de trabajo y reglamento de seguridad y calidad.", porcentaje: "NA", evalua: "JEFE/RH", comentarios: "" },
  { descripcion: "Cumplir con asistencia.", porcentaje: "NA", evalua: "RH", comentarios: "" },
  { descripcion: "Cumplir con puntualidad.", porcentaje: "NA", evalua: "RH", comentarios: "" },
  { descripcion: "No presentar más de dos permisos por mes.", porcentaje: "NA", evalua: "RH", comentarios: "" },
]

export const DEFAULT_COMPETENCIAS: Competencia[] = [
  {
    nombre: "Flexibilidad y adaptación",
    descripcion: "Capacidad para trabajar con eficacia en situaciones variadas y/o inusuales, con personas o grupos diversos. Implica comprender y valorar posturas distintas a las propias, incluso puntos de vista encontrados, modificar su propio enfoque a medida que la situación cambiante lo requiera, y promover dichos cambios en su ámbito de actuación.",
    calificacion: 0,
    comentarios: "",
  },
  {
    nombre: "Respeto",
    descripcion: "Capacidad para dar a los otros y a uno mismo un trato digno, franco y tolerante, y comportarse de acuerdo con los valores morales, las buenas costumbres y las buenas prácticas profesionales, y para actuar con seguridad y congruencia entre el decir y el hacer.",
    calificacion: 0,
    comentarios: "",
  },
  {
    nombre: "Compromiso con la calidad",
    descripcion: "Implica la capacidad para construir relaciones basadas en una conducta honesta y veraz. Capacidad para actuar con velocidad y sentido de urgencia a fin de alcanzar los objetivos junto con altos niveles de desempeño en su puesto de trabajo. Capacidad para aplicar políticas y directrices recibidas de sus superiores con el propósito de obtener los resultados esperados. Implica un compromiso constante por mantenerse actualizado y aportar soluciones para alcanzar estándares de calidad esperados.",
    calificacion: 0,
    comentarios: "",
  },
  {
    nombre: "Trabajo en equipo",
    descripcion: "Capacidad para colaborar con los demás, formar parte de un grupo y trabajar con otras áreas de la organización con el propósito de alcanzar, en conjunto, la estrategia organizacional, subordinar los intereses personales a los objetivos grupales. Implica tener expectativas positivas respecto de los demás, comprender a los otros, y generar y mantener un buen clima de trabajo. Incluye su compromiso y participación en las reuniones de trabajo con otras áreas.",
    calificacion: 0,
    comentarios: "",
  },
]

// ═══════════════════════════════════════════════════════════════
// OBJETIVOS POR PUESTO
// ═══════════════════════════════════════════════════════════════

const _OBJETIVOS_OPERADOR_MAQUINA: Objetivo[] = [
  { numero: 1, descripcion: "Operar la máquina asignada cumpliendo los estándares de producción", resultado: "80%", porcentaje: "NA", comentarios: "" },
  { numero: 2, descripcion: "Reportar fallas y anomalías de la máquina al supervisor de turno", resultado: "80%", porcentaje: "NA", comentarios: "" },
  { numero: 3, descripcion: "Cumplir con los tiempos de ciclo y metas de producción por turno", resultado: "80%", porcentaje: "NA", comentarios: "" },
  { numero: 4, descripcion: "Mantener limpieza y orden en el área de trabajo y máquina asignada", resultado: "100%", porcentaje: "NA", comentarios: "" },
  { numero: 5, descripcion: "Seguir las instrucciones de trabajo y procedimientos de seguridad", resultado: "90%", porcentaje: "NA", comentarios: "" },
]

export const OBJETIVOS_POR_PUESTO: Record<string, Objetivo[]> = {
  "OPERADOR DE MÁQUINA A": _OBJETIVOS_OPERADOR_MAQUINA,
  "OPERADOR DE MÁQUINA B": _OBJETIVOS_OPERADOR_MAQUINA,
  "OPERADOR DE MÁQUINA C": _OBJETIVOS_OPERADOR_MAQUINA,
  "OPERADOR DE MÁQUINA D": _OBJETIVOS_OPERADOR_MAQUINA,
}

// ═══════════════════════════════════════════════════════════════
// CÁLCULOS DE PONDERACIÓN
// ═══════════════════════════════════════════════════════════════

export interface ResultadoPonderacion {
  promedioParte1: number
  ponderadoParte1: number
  promedioParte2: number
  ponderadoParte2: number
  promedioParte3: number
  ponderadoParte3: number
  calificacionFinal: number
}

export function calcularPonderacion(data: DesempenoData): ResultadoPonderacion {
  // Parte 1: promedio de % Obtenido de objetivos
  const objVals = data.objetivos
    .map((o) => parseFloat(o.porcentaje))
    .filter((v) => !isNaN(v))
  const promedioParte1 = objVals.length > 0
    ? objVals.reduce((s, v) => s + v, 0) / objVals.length
    : 0
  const ponderadoParte1 = Math.round(promedioParte1 * 0.4)

  // Parte 2: promedio de % cumplimiento
  const cumpVals = data.cumplimiento_responsabilidades
    .map((c) => parseFloat(c.porcentaje))
    .filter((v) => !isNaN(v))
  const promedioParte2 = cumpVals.length > 0
    ? cumpVals.reduce((s, v) => s + v, 0) / cumpVals.length
    : 0
  const ponderadoParte2 = Math.round(promedioParte2 * 0.3)

  // Parte 3: promedio de competencias como %
  const compVals = data.competencias
    .filter((c) => c.calificacion > 0)
    .map((c) => (c.calificacion / 4) * 100)
  const promedioParte3 = compVals.length > 0
    ? compVals.reduce((s, v) => s + v, 0) / compVals.length
    : 0
  const ponderadoParte3 = Math.round(promedioParte3 * 0.3)

  return {
    promedioParte1: Math.round(promedioParte1),
    ponderadoParte1,
    promedioParte2: Math.round(promedioParte2),
    ponderadoParte2,
    promedioParte3: Math.round(promedioParte3),
    ponderadoParte3,
    calificacionFinal: ponderadoParte1 + ponderadoParte2 + ponderadoParte3,
  }
}

// ═══════════════════════════════════════════════════════════════
// DATA INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface DesempenoData {
  numero_empleado: string
  nombre: string
  puesto: string
  evaluador_nombre: string
  evaluador_puesto: string
  tipo: DesempenoTipo
  periodo: string
  objetivos: Objetivo[]
  cumplimiento_responsabilidades: CumplimientoItem[]
  competencias: Competencia[]
  compromisos: string
  fecha_revision: string
  observaciones: string
  calificacion_final: number
  incidencias?: IncidenciaResumen[]
}

export const SAMPLE_EMPLEADO_645: DesempenoData = {
  numero_empleado: "645",
  nombre: "PACHECO CORDOBA MA DE LOS ANGELES",
  puesto: "AUXILIAR DE BÁSCULA A",
  evaluador_nombre: "BIBIANO GARCIA FLOR",
  evaluador_puesto: "SUPERVISOR DE PRODUCCIÓN",
  tipo: "operativo",
  periodo: "MARZO-ABRIL 2026",
  objetivos: [
    { numero: 1, descripcion: "Realizar los pesajes al 100% de la produccion por turno", resultado: "80%", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Asegurar el 100% de entrega de piezas al area de Almacen", resultado: "80%", porcentaje: "20%", comentarios: "" },
    { numero: 3, descripcion: "Asegurar cantidad de producción al 100%", resultado: "NA", porcentaje: "80%", comentarios: "" },
    { numero: 4, descripcion: "Realizar el 100% de traspasos con el kardex correspondientes en el RPS", resultado: "100%", porcentaje: "100%", comentarios: "" },
    { numero: 5, descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente", resultado: "90%", porcentaje: "50%", comentarios: "" },
  ],
  cumplimiento_responsabilidades: [
    { descripcion: "Cumplir compromisos derivados de sus planes de seguimiento por desempeño.", porcentaje: "NA", evalua: "JEFE", comentarios: "" },
    { descripcion: "Cumplir con lineamientos de reglamento interior de trabajo y reglamento de seguridad y calidad.", porcentaje: "RH", evalua: "JEFE/RH", comentarios: "Se le detecta continuamente usando el celular" },
    { descripcion: "Cumplir con asistencia.", porcentaje: "RH", evalua: "RH", comentarios: "" },
    { descripcion: "Cumplir con puntualidad.", porcentaje: "RH", evalua: "RH", comentarios: "" },
    { descripcion: "No presentar más de dos permisos por mes.", porcentaje: "RH", evalua: "RH", comentarios: "" },
  ],
  competencias: [
    { nombre: "Flexibilidad y adaptación", descripcion: "Capacidad para trabajar con eficacia...", calificacion: 4, comentarios: "" },
    { nombre: "Respeto", descripcion: "Capacidad para dar a los otros...", calificacion: 4, comentarios: "" },
    { nombre: "Compromiso con la calidad", descripcion: "Implica la capacidad para construir...", calificacion: 3, comentarios: "" },
    { nombre: "Trabajo en equipo", descripcion: "Capacidad para colaborar con los demás...", calificacion: 2, comentarios: "" },
  ],
  compromisos: "Dejar de usar el equipo telefonico, No realizar acumulacion de piezas para evitar paros de maquina, no cumple con lineamientos",
  fecha_revision: "15/01/2026",
  observaciones: "",
  calificacion_final: 49,
}
