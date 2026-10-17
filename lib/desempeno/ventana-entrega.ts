/** La recepción física del periodo DIC–MAY es en junio; la de JUN–NOV, en enero. */
export function getVentanaEntrega(periodo: string, fecha = new Date()) {
  const match = /^(DIC-MAY|JUN-NOV) (\d{4})$/.exec(periodo)
  if (!match) return null

  const year = Number(match[2])
  const inicio = match[1] === "DIC-MAY" ? new Date(year, 5, 1) : new Date(year + 1, 0, 1)
  const fin = match[1] === "DIC-MAY" ? new Date(year, 5, 15) : new Date(year + 1, 0, 15)
  const hoy = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const estado = hoy < inicio ? "Próxima" : hoy > fin ? "Concluida" : "En curso"

  return { inicio, fin, estado }
}
