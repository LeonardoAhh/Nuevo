import { getPeriodosDesempeno } from "@/lib/catalogo"

/** El mes de la fecha programada determina el mes final del periodo mensual. */
export function periodoMensualDeFecha(fecha: string | null): string | null {
  const match = fecha?.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return getPeriodosDesempeno(year).mensuales[month - 1]
}
