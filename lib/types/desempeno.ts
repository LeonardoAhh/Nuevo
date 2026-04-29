export interface Objetivo {
  numero: number
  descripcion: string
  resultado: string
  porcentaje: string
  comentarios: string
}

export interface Competencia {
  nombre: string
  descripcion: string
  calificacion: number // 0-4
}

export interface IncidenciaResumen {
  categoria: string
  valor: number | null
  notas: string | null
  mes: string | null
}

export type DesempenoTipo = 'operativo' | 'administrativo' | 'jefe'

export const DEFAULT_OBJETIVOS_POR_TIPO: Record<DesempenoTipo, Objetivo[]> = {
  operativo: [
    { numero: 1, descripcion: "Asegurar pesajes correctos y oportunos en cada turno", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Mantener limpieza y orden en la báscula y área de trabajo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 3, descripcion: "Reportar incidencias de peso y calidad conforme a procedimiento", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 4, descripcion: "Cumplir con el 100% de las rutinas de seguridad e higiene", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 5, descripcion: "Apoyar en la recepción de materia prima con tiempos establecidos", resultado: "NA", porcentaje: "NA", comentarios: "" }
  ],
  administrativo: [
    { numero: 1, descripcion: "Gestionar documentación y archivos internos con precisión", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Atender solicitudes de clientes y áreas internas en tiempo y forma", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 3, descripcion: "Mantener actualización de sistemas y registros administrativos", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 4, descripcion: "Colaborar en el cierre de procesos contables y administrativos", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 5, descripcion: "Proponer mejoras en flujo de trabajo y controles administrativos", resultado: "NA", porcentaje: "NA", comentarios: "" }
  ],
  jefe: [
    { numero: 1, descripcion: "Supervisar cumplimiento de metas y calidad del equipo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 2, descripcion: "Motivar y desarrollar al personal a su cargo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 3, descripcion: "Garantizar que las órdenes de trabajo se cumplan en tiempo", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 4, descripcion: "Dar seguimiento a incidencias y acciones correctivas", resultado: "NA", porcentaje: "NA", comentarios: "" },
    { numero: 5, descripcion: "Comunicar resultados y prioridades al área de dirección", resultado: "NA", porcentaje: "NA", comentarios: "" }
  ]
}

/**
 * Objetivos por puesto concreto.
 * Clave = nombre exacto del puesto en CATALOGO_ORGANIZACIONAL.
 * Puestos que comparten objetivos (ej: OPERADOR DE MÁQUINA A/B/C/D) apuntan al mismo array.
 * TODO: llenar manualmente con objetivos específicos por puesto.
 * Fallback: si un puesto no está aquí, se usan DEFAULT_OBJETIVOS_POR_TIPO según su tipo.
 */
const _OBJETIVOS_OPERADOR_MAQUINA: Objetivo[] = [
  { numero: 1, descripcion: "Operar la máquina asignada cumpliendo los estándares de producción", resultado: "NA", porcentaje: "NA", comentarios: "" },
  { numero: 2, descripcion: "Reportar fallas y anomalías de la máquina al supervisor de turno", resultado: "NA", porcentaje: "NA", comentarios: "" },
  { numero: 3, descripcion: "Cumplir con los tiempos de ciclo y metas de producción por turno", resultado: "NA", porcentaje: "NA", comentarios: "" },
  { numero: 4, descripcion: "Mantener limpieza y orden en el área de trabajo y máquina asignada", resultado: "NA", porcentaje: "NA", comentarios: "" },
  { numero: 5, descripcion: "Seguir las instrucciones de trabajo y procedimientos de seguridad", resultado: "NA", porcentaje: "NA", comentarios: "" },
]

export const OBJETIVOS_POR_PUESTO: Record<string, Objetivo[]> = {
  // ── PRODUCCIÓN ──
  "OPERADOR DE MÁQUINA A": _OBJETIVOS_OPERADOR_MAQUINA,
  "OPERADOR DE MÁQUINA B": _OBJETIVOS_OPERADOR_MAQUINA,
  "OPERADOR DE MÁQUINA C": _OBJETIVOS_OPERADOR_MAQUINA,
  "OPERADOR DE MÁQUINA D": _OBJETIVOS_OPERADOR_MAQUINA,
  // TODO: agregar más puestos aquí
}

export interface DesempenoData {
  numero_empleado: string
  nombre: string
  puesto: string
  evaluador_nombre: string
  evaluador_puesto: string
  tipo: 'operativo' | 'administrativo' | 'jefe'
  periodo: string
  objetivos: Objetivo[]
  cumplimiento_responsabilidades: Record<string, string>[]
  competencias: Competencia[]
  compromisos: string
  fecha_revision: string
  observaciones: string
  calificacion_final: number
  incidencias?: IncidenciaResumen[]
}

// Datos sample del JSON
export const SAMPLE_EMPLEADO_645: DesempenoData = {
  numero_empleado: "645",
  nombre: "PACHECO CORDOBA MA DE LOS ANGELES",
  puesto: "AUXILIAR DE BÁSCULA A",
  evaluador_nombre: "BIBIANO GARCIA FLOR",
  evaluador_puesto: "SUPERVISOR DE PRODUCCIÓN",
  tipo: "operativo",
  periodo: "MARZO-ABRIL 2026",
  objetivos: [
    {
      numero: 1,
      descripcion: "Realizar los pesajes al 100% de la produccion por turno",
      resultado: "NA",
      porcentaje: "NA",
      comentarios: ""
    }
    // ... resto objetivos JSON
  ],
  cumplimiento_responsabilidades: [
    { "% Cumplir compromisos": "NA", evalua: "JEFE" },
    { "% Cumplimiento reglamentos": "RH", comentarios: "Se le detecta continuamente usando el celular" }
  ],
  competencias: [
    {
      nombre: "Flexibilidad y adaptación",
      descripcion: "Capacidad para trabajar con eficacia...",
      calificacion: 2
    }
  ],
  compromisos: "Dejar de usar el equipo telefonico, No realizar acumulacion de piezas...",
  fecha_revision: "15/01/2026",
  observaciones: "",
  calificacion_final: 100
}
