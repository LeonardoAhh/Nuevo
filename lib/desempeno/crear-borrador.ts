import { getTipoDesempenoByPuesto, mesesDePeriodo } from "@/lib/catalogo"
import { OBJETIVOS_POR_PUESTO } from "@/lib/desempeno/objetivos-catalogo"
import {
  DEFAULT_COMPETENCIAS_POR_TIPO,
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_CUMPLIMIENTO_POR_TIPO,
  DEFAULT_OBJETIVOS_POR_TIPO,
  type Competencia,
  type CumplimientoItem,
  type DesempenoData,
} from "@/lib/types/desempeno"

export interface EmpleadoParaEvaluacion {
  numero: string
  nombre: string
  puesto: string
}

export interface IncidenciaParaEvaluacion {
  categoria: string | null
  valor: number | null
  notas: string | null
  mes: string | null
}

const ESCALA_GRADUADA: Record<number, number> = { 0: 100, 1: 66, 2: 33 }
const aplicarEscala = (count: number): number => ESCALA_GRADUADA[count] ?? 0

export function calcularAsistenciaPorcentaje(incidencias: IncidenciaParaEvaluacion[], periodo: string): number {
  const meses = mesesDePeriodo(periodo)
  const faltasDeMes = (mes: string) => incidencias
    .filter((item) => item.mes === mes && item.categoria === "FALTA INJUSTIFICADA")
    .reduce((total, item) => total + (item.valor ?? 0), 0)

  if (meses.length) {
    const mesesConDatos = meses.filter((mes) => incidencias.some((item) => item.mes === mes))
    if (!mesesConDatos.length) return 100
    return Math.round(mesesConDatos.reduce((total, mes) => total + aplicarEscala(faltasDeMes(mes)), 0) / mesesConDatos.length)
  }

  return aplicarEscala(incidencias
    .filter((item) => item.categoria === "FALTA INJUSTIFICADA")
    .reduce((total, item) => total + (item.valor ?? 0), 0))
}

export function crearBorradorEvaluacion(
  empleado: EmpleadoParaEvaluacion,
  periodo: string,
  incidencias: IncidenciaParaEvaluacion[],
): DesempenoData {
  const tipo = getTipoDesempenoByPuesto(empleado.puesto)
  const cumplimiento: CumplimientoItem[] = (DEFAULT_CUMPLIMIENTO_POR_TIPO[tipo] ?? DEFAULT_CUMPLIMIENTO).map((item) => ({ ...item }))
  if (tipo !== "jefe" && cumplimiento[2]) {
    cumplimiento[2].porcentaje = String(calcularAsistenciaPorcentaje(incidencias, periodo))
  }
  const competencias: Competencia[] = (DEFAULT_COMPETENCIAS_POR_TIPO[tipo] ?? DEFAULT_COMPETENCIAS_POR_TIPO.operativo).map((item) => ({ ...item }))

  return {
    numero_empleado: empleado.numero,
    nombre: empleado.nombre,
    puesto: empleado.puesto,
    evaluador_nombre: "",
    evaluador_puesto: "",
    tipo,
    periodo,
    objetivos: (OBJETIVOS_POR_PUESTO[empleado.puesto] ?? DEFAULT_OBJETIVOS_POR_TIPO[tipo]).map((item) => ({ ...item })),
    cumplimiento_responsabilidades: cumplimiento,
    competencias,
    compromisos: "",
    fecha_revision: "",
    observaciones: "",
    calificacion_final: 0,
    incidencias: incidencias.map((item) => ({
      categoria: item.categoria ?? "",
      valor: item.valor,
      notas: item.notas,
      mes: item.mes,
    })),
  }
}
