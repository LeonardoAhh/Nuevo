export const SAVED_DETAIL = {
  title: "Evaluaciones guardadas",
  description: "Consulta la calificación, edita o imprime cada evaluación.",
  close: "Cerrar detalle de evaluaciones",
  edit: "Editar",
  print: "Imprimir",
  printing: "Cargando…",
  remove: "Eliminar evaluación",
  score: "Calificación",
  noScore: "Sin calificación",
  noPeriod: "Sin periodo",
  empty: "No hay evaluaciones guardadas para este empleado.",
  count: (total: number) => `${total} ${total === 1 ? "evaluación" : "evaluaciones"}`,
} as const;
