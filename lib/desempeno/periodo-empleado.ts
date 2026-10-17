import { getPeriodoActual, type PeriodoModo } from "@/lib/catalogo"
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad"

export type OrigenEmpleado = "planta" | "nuevo_ingreso"

/** La misma asignación que usa Evaluar para una evaluación nueva. */
export function periodoVigenteParaEmpleado(origen: OrigenEmpleado, fechaIngreso: string | null, fecha = new Date()) {
  const semestreActual = getPeriodoActual("semestrales", fecha)
  const requiereSemestral = origen === "planta" && esElegibleParaPeriodo(fechaIngreso, semestreActual).elegible
  const modo: PeriodoModo = requiereSemestral ? "semestrales" : "mensuales"
  return { modo, periodo: getPeriodoActual(modo, fecha), semestreActual, requiereSemestral }
}
