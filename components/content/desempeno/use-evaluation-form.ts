"use client";

import { useEffect, useRef, useState } from "react";
import { useEvaluationReducedMotion } from "./use-evaluation-motion";
import {
  calcularPonderacion,
  tieneRespuestaPorcentaje,
  validarEvaluacion,
  UMBRAL_CALIFICACION_APROBATORIA,
  type DesempenoData,
} from "@/lib/types/desempeno";
import { EVALUADORES_PUESTO } from "@/lib/catalogo";

export interface EvaluationFormProps {
  data: DesempenoData;
  onUpdate?: (data: DesempenoData) => void;
  onGuardar?: () => void;
  guardarDisabled?: boolean;
  guardarTooltip?: string;
}

export function useEvaluationForm({ data, onUpdate, onGuardar, guardarDisabled, guardarTooltip }: EvaluationFormProps) {
  const reducedMotion = useEvaluationReducedMotion();
  const [activeView, setActiveView] = useState(1);
  const [stepError, setStepError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const identity = `${data.numero_empleado}:${data.periodo}`;

  useEffect(() => {
    setActiveView(1);
    setStepError("");
  }, [identity]);

  const focusStep = () => requestAnimationFrame(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });

  const goNextView = () => {
    const validation = validarEvaluacion(data);
    if (!validation.pasos[activeView - 1]) {
      const messages = [
        "Selecciona al evaluador para continuar.",
        "Responde todos los objetivos con un porcentaje o No aplica.",
        "Responde todas las responsabilidades con un porcentaje o No aplica.",
        "Califica todas las competencias; el cero también es válido.",
        `Captura compromisos para una calificación menor a ${UMBRAL_CALIFICACION_APROBATORIA}%.`,
      ];
      setStepError(messages[activeView - 1] ?? "Completa este paso para continuar.");
      requestAnimationFrame(() => {
        const selector = activeView === 1
          ? '[aria-label="Evaluador"]'
          : activeView === 4
            ? 'input[type="radio"]'
            : '[aria-invalid="true"]';
        (document.querySelector<HTMLElement>(selector) ?? document.querySelector<HTMLElement>(`[data-step-error="${activeView}"]`))?.focus();
      });
      return;
    }
    setStepError("");
    setActiveView(value => Math.min(5, value + 1));
    focusStep();
  };

  const goPrevView = () => {
    setStepError("");
    setActiveView(value => Math.max(1, value - 1));
    focusStep();
  };

  const handleEvaluadorChange = (nombre: string) => onUpdate?.({
    ...data,
    evaluador_nombre: nombre,
    evaluador_puesto: EVALUADORES_PUESTO[nombre] ?? "",
  });

  const updateObjetivo = (index: number, porcentaje: string, noAplica = false) => {
    const objetivos = data.objetivos.map((item, itemIndex) => itemIndex === index
      ? { ...item, porcentaje: noAplica ? "NA" : porcentaje, no_aplica: noAplica }
      : item);
    onUpdate?.({ ...data, objetivos });
  };

  const updateResponsabilidad = (index: number, porcentaje: string, noAplica = false) => {
    const cumplimiento_responsabilidades = data.cumplimiento_responsabilidades.map((item, itemIndex) => itemIndex === index
      ? { ...item, porcentaje: noAplica ? "NA" : porcentaje, no_aplica: noAplica }
      : item);
    onUpdate?.({ ...data, cumplimiento_responsabilidades });
  };

  const updateCompetencia = (index: number, calificacion: number) => {
    const competencias = data.competencias.map((item, itemIndex) => itemIndex === index
      ? { ...item, calificacion, evaluada: true }
      : item);
    onUpdate?.({ ...data, competencias });
  };

  const updateReview = (patch: Partial<Pick<DesempenoData, "compromisos" | "fecha_revision" | "observaciones">>) => {
    onUpdate?.({ ...data, ...patch });
  };

  const ponderacion = calcularPonderacion(data);
  return {
    data,
    onUpdate,
    onGuardar,
    guardarDisabled,
    guardarTooltip,
    activeView,
    setActiveView,
    goNextView,
    goPrevView,
    headingRef,
    stepError,
    setStepError,
    ponderacion,
    canEdit: Boolean(onUpdate),
    faltaEvaluador: !data.evaluador_nombre,
    isObjetivosCompletado: data.objetivos.length > 0 && data.objetivos.every(tieneRespuestaPorcentaje),
    isResponsabilidadesCompletado: data.cumplimiento_responsabilidades.length > 0 && data.cumplimiento_responsabilidades.every(tieneRespuestaPorcentaje),
    isCompetenciasCompletado: data.competencias.length > 0 && data.competencias.every(item => item.evaluada === true),
    handleEvaluadorChange,
    updateObjetivo,
    updateResponsabilidad,
    updateCompetencia,
    updateReview,
  };
}

export type EvaluationFormContext = ReturnType<typeof useEvaluationForm>;
