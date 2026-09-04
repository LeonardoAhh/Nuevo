import { DESEMPENO, EVALUATION_WEIGHTS } from "@/lib/desempeno/presentation";
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno";

export interface GuideStep {
  id: string;
  label: string;
  title: string;
  description: string;
  instructions: readonly string[];
  note: string;
  weights?: readonly { label: string; value: number }[];
}

export const GUIDE_COPY = {
  title: `${DESEMPENO.actions.guide} de evaluación`,
  description: "Consulta cómo buscar, evaluar y entregar el formato.",
  navigation: "Pasos de la guía",
  close: "Cerrar guía",
  previous: "Anterior",
  next: DESEMPENO.actions.next,
  finish: "Entendido",
  reminder: "Ten en cuenta",
  weights: "Peso en la calificación final",
  preview: "Vista de referencia",
  details: "Ver instrucciones y recomendaciones",
  save: "Guardar",
  print: "Imprimir",
  saved: "Evaluación guardada",
  delivery: "Imprime, recolecta firmas y entrega a Capacitación.",
  step: (index: number, total: number) => `Paso ${index + 1} de ${total}`,
} as const;

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: "search",
    label: "Buscar",
    title: "Busca al empleado",
    description: "Comienza en Evaluar. Busca por número o nombre y verifica la información de la persona antes de continuar.",
    instructions: [
      DESEMPENO.search.help,
      "También puedes usar el botón Buscar o elegir una búsqueda reciente.",
      "Confirma el nombre, el número de empleado y el puesto en la información cargada.",
    ],
    note: "La barra superior reúne Evaluar, Pendientes y, según tus permisos, Historial. Ahí también puedes abrir esta guía.",
  },
  {
    id: "period",
    label: "Periodo",
    title: "Selecciona el periodo",
    description: "Elige el tipo de evaluación y el periodo que vas a registrar.",
    instructions: [
      `Selecciona ${DESEMPENO.modes.semestrales} o ${DESEMPENO.modes.mensuales} en el buscador.`,
      "Elige el periodo correspondiente en la lista desplegable.",
      "Revisa los avisos de elegibilidad o de periodo antes de comenzar la captura.",
    ],
    note: "Verifica el periodo antes de llenar la evaluación para evitar capturar en uno incorrecto.",
  },
  {
    id: "evaluate",
    label: DESEMPENO.pages.evaluation.title,
    title: "Completa la evaluación",
    description: "Revisa cada sección y captura la evaluación con el responsable correspondiente.",
    instructions: [
      "Selecciona al evaluador responsable.",
      "Revisa los objetivos, el cumplimiento de responsabilidades y las competencias.",
      "Captura los compromisos y observaciones que correspondan.",
    ],
    weights: [
      { label: DESEMPENO.sections.objetivos, value: EVALUATION_WEIGHTS.objetivos },
      { label: DESEMPENO.sections.cumplimiento, value: EVALUATION_WEIGHTS.cumplimiento },
      { label: DESEMPENO.sections.competencias, value: EVALUATION_WEIGHTS.competencias },
    ],
    note: "Cada sección aporta un peso distinto a la calificación final.",
  },
  {
    id: "save",
    label: "Guardar",
    title: "Guarda la evaluación",
    description: "Revisa la captura y utiliza Guardar en las acciones de la evaluación activa.",
    instructions: [
      "Confirma el empleado, el periodo y el evaluador seleccionado.",
      "Atiende los avisos que impidan guardar la evaluación.",
      "Presiona Guardar y espera la confirmación antes de imprimir.",
    ],
    note: `Si la calificación final es menor a ${UMBRAL_CALIFICACION_APROBATORIA}%, captura los compromisos de mejora para poder guardar e imprimir.`,
  },
  {
    id: "print",
    label: "Entregar",
    title: "Imprime y entrega",
    description: "Con la evaluación guardada, genera el formato oficial para su entrega.",
    instructions: [
      "Usa Imprimir en las acciones de la evaluación.",
      "Imprime el formato y recolecta las firmas requeridas.",
      "Entrega el documento físico al departamento de Capacitación.",
    ],
    note: "Guarda la evaluación antes de imprimir. Si la opción está deshabilitada, revisa el aviso del botón.",
  },
];
