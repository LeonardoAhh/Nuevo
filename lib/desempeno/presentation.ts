/** Shared vocabulary and routes for the evaluation workflow. */
export const DESEMPENO = {
  title: "Evaluación de Desempeño",
  pages: {
    evaluation: { title: "Evaluar", description: "Busca un empleado, selecciona el periodo y completa su evaluación." },
    pending: { title: "Pendientes", description: "Consulta las evaluaciones pendientes por departamento y tipo de periodo." },
    saved: { title: "Historial", description: "Consulta objetivos por puesto y revisa las evaluaciones guardadas." },
  },
  routes: {
    home: "/desempeno",
    saved: "/desempeno/objetivos",
    pending: "/desempeno/pendientes",
  },
  search: {
    title: "Buscar empleado",
    placeholder: "Buscar por número o nombre…",
    help: "Escribe al menos dos caracteres para ver sugerencias. Usa las flechas para elegir y Enter para buscar.",
    label: "Número o nombre del empleado",
    clear: "Limpiar búsqueda",
    loading: "Buscando…",
    empty: "Sin coincidencias",
    recent: "Búsquedas recientes",
    period: "Periodo de evaluación",
  },
  modes: { semestrales: "Semestral", mensuales: "Mensual" },
  sections: {
    objetivos: "Cumplimiento de Objetivos",
    cumplimiento: "Cumplimiento de Responsabilidades",
    competencias: "Competencias Blandas",
    compromisos: "Compromisos y observaciones",
  },
  instructions: "La evaluación está integrada por tres partes: objetivos SMART del puesto, cumplimiento de responsabilidades con información de RH y SGI, y competencias evaluadas por el jefe inmediato.",
  descriptions: {
    objetivos: "Sin importar cómo se exprese el resultado, cada objetivo debe evaluarse con un porcentaje de cumplimiento entre 1% y 100% para considerarse válido.",
    cumplimiento: "Algunos datos de esta sección son prellenados por el sistema.",
    competencias: "Escala de evaluación: 0, competencia no demostrada; 1, aplicación ocasional; 2, aplicación intermitente; 3, aplicación frecuente; 4, totalmente integrado en el desempeño cotidiano.",
    compromisos: "Describe los compromisos y planes de acción acordados para fortalecer los factores que obtuvieron una menor calificación.",
  },
  fields: {
    employeeNumber: "Número empleado",
    name: "Nombre",
    position: "Puesto del evaluado",
    evaluator: "Evaluador",
    commitments: "Compromisos / Acuerdos",
    reviewDate: "Fecha de revisión",
    observations: "Observaciones",
  },
  actions: { save: "Guardar evaluación", next: "Siguiente", back: "Atrás", edit: "Capturar", guide: "Guía" },
} as const

export const EVALUATION_WEIGHTS = { objetivos: 0.4, cumplimiento: 0.3, competencias: 0.3 } as const

export const SEARCH_OPTIONS = { minLength: 2, debounceMs: 300, recentLimit: 5, recentStorageKey: "desempeno_recientes" } as const
