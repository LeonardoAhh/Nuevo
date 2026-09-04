"use client";

import { useEvaluationReducedMotion } from "./use-evaluation-motion";
import type { DesempenoData } from "@/lib/types/desempeno";
import { useState } from "react";
import { confirm } from "@/components/ui/confirm-dialog";
import { calcularPonderacion, type Objetivo, type CumplimientoItem, type Competencia } from "@/lib/types/desempeno";
import { EVALUADORES_PUESTO } from "@/lib/catalogo";
import type { ModalType } from "./form-controls";
export interface EvaluationFormProps {
  data: DesempenoData;
  onUpdate?: (data: DesempenoData) => void;
  onGuardar?: () => void;
  guardarDisabled?: boolean;
  guardarTooltip?: string;
}
export function useEvaluationForm({
  data,
  onUpdate,
  onGuardar,
  guardarDisabled,
  guardarTooltip
}: EvaluationFormProps) {
  const reducedMotion = useEvaluationReducedMotion();
  const [modal, setModal] = useState<ModalType>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [editObjetivos, setEditObjetivos] = useState<Objetivo[]>([]);
  const [editCumplimiento, setEditCumplimiento] = useState<CumplimientoItem[]>([]);
  const [editCompetencias, setEditCompetencias] = useState<Competencia[]>([]);
  const [editCompromisos, setEditCompromisos] = useState("");
  const [editFechaRevision, setEditFechaRevision] = useState("");
  const [editObservaciones, setEditObservaciones] = useState("");
  const [activeView, setActiveView] = useState(1);
  const goNextView = () => {
    setActiveView(v => Math.min(5, v + 1));
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'instant' : 'smooth'
    });
  };
  const goPrevView = () => {
    setActiveView(v => Math.max(1, v - 1));
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'instant' : 'smooth'
    });
  };
  const ponderacion = calcularPonderacion(data);
  const canEdit = !!onUpdate;
  const faltaEvaluador = !data.evaluador_nombre;

  // ── Lógica de Flujo Secuencial (Progressive Disclosure) ────────────────────
  const isObjetivosCompletado = data.objetivos.some(o => o.porcentaje.trim() !== "" || o.resultado.trim() !== "");
  const isResponsabilidadesCompletado = data.cumplimiento_responsabilidades.every(c => c.porcentaje.trim() !== "");
  const isCompetenciasCompletado = data.competencias.some(c => c.calificacion > 0);
  const step1Complete = isObjetivosCompletado;
  const step2Complete = step1Complete && isResponsabilidadesCompletado;
  const step3Complete = step2Complete && isCompetenciasCompletado;
  const viewAnimProps = {
    initial: reducedMotion ? false as const : {
      opacity: 0,
      x: 20
    },
    animate: {
      opacity: 1,
      x: 0
    },
    exit: reducedMotion ? {
      opacity: 1
    } : {
      opacity: 0,
      x: -20
    },
    transition: {
      duration: reducedMotion ? 0 : 0.3
    }
  };

  // ── Handlers modales ──────────────────────────────────────────────────────

  const openModal = (type: ModalType) => {
    if (!canEdit) return;
    if (type === "objetivos") setEditObjetivos(data.objetivos.map(o => ({
      ...o
    })));
    if (type === "cumplimiento") setEditCumplimiento(data.cumplimiento_responsabilidades.map(c => ({
      ...c
    })));
    if (type === "competencias") setEditCompetencias(data.competencias.map(c => ({
      ...c
    })));
    if (type === "compromisos") {
      setEditCompromisos(data.compromisos);
      setEditFechaRevision(data.fecha_revision);
      setEditObservaciones(data.observaciones);
    }
    setStep(0);
    setDirection(1);
    setModal(type);
  };
  const hasChanges = () => {
    if (modal === "objetivos") return JSON.stringify(editObjetivos) !== JSON.stringify(data.objetivos);
    if (modal === "cumplimiento") return JSON.stringify(editCumplimiento) !== JSON.stringify(data.cumplimiento_responsabilidades);
    if (modal === "competencias") return JSON.stringify(editCompetencias) !== JSON.stringify(data.competencias);
    if (modal === "compromisos") {
      return editCompromisos !== (data.compromisos || "") || editFechaRevision !== (data.fecha_revision || "") || editObservaciones !== (data.observaciones || "");
    }
    return false;
  };
  const closeModal = async () => {
    if (hasChanges()) {
      const isConfirmed = await confirm({
        title: "Cambios sin guardar",
        description: "¿Estás seguro de que deseas descartar los cambios que has hecho?",
        confirmLabel: "Descartar",
        cancelLabel: "Cancelar",
        tone: "warning"
      });
      if (!isConfirmed) return;
    }
    setModal(null);
  };
  const saveModal = () => {
    if (!onUpdate) return;
    if (modal === "objetivos") onUpdate({
      ...data,
      objetivos: editObjetivos
    });
    if (modal === "cumplimiento") onUpdate({
      ...data,
      cumplimiento_responsabilidades: editCumplimiento
    });
    if (modal === "competencias") onUpdate({
      ...data,
      competencias: editCompetencias
    });
    if (modal === "compromisos") {
      onUpdate({
        ...data,
        compromisos: editCompromisos,
        fecha_revision: editFechaRevision,
        observaciones: editObservaciones
      });
    }
    setModal(null);
  };

  // ── Navegación por pasos ──────────────────────────────────────────────────

  const totalSteps = modal === "objetivos" ? editObjetivos.length : modal === "cumplimiento" ? editCumplimiento.length : modal === "competencias" ? editCompetencias.length : 1;
  const isLastStep = step >= totalSteps - 1;
  const goNext = () => {
    if (isLastStep) {
      saveModal();
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };
  const goPrev = () => {
    setDirection(-1);
    setStep(s => Math.max(0, s - 1));
  };
  const handleStepSelect = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };
  const handlePorcentajeChange = (e: React.ChangeEvent<HTMLInputElement>, stepIdx: number, type: "objetivos" | "cumplimiento") => {
    let v = e.target.value.replace(/[^0-9]/g, "");
    if (v !== "") {
      let num = parseInt(v, 10);
      if (num > 100) num = 100;
      v = num.toString();
    }
    if (type === "objetivos") {
      const next = [...editObjetivos];
      next[stepIdx] = {
        ...next[stepIdx],
        porcentaje: v
      };
      setEditObjetivos(next);
    } else {
      const next = [...editCumplimiento];
      next[stepIdx] = {
        ...next[stepIdx],
        porcentaje: v
      };
      setEditCumplimiento(next);
    }
  };

  // ── Handler evaluador (solo campos que cambian) ───────────────────────────

  const handleEvaluadorChange = (nombre: string) => {
    onUpdate?.({
      ...data,
      evaluador_nombre: nombre,
      evaluador_puesto: EVALUADORES_PUESTO[nombre] ?? ""
    });
  };

  // ── Handler fecha ────────────────────────────────────────────────────────
  const dateValue = editFechaRevision.includes("/") ? editFechaRevision.split("/").reverse().join("-") : editFechaRevision;
  return {
    data,
    onUpdate,
    onGuardar,
    guardarDisabled,
    guardarTooltip,
    modal,
    setModal,
    step,
    setStep,
    direction,
    setDirection,
    editObjetivos,
    setEditObjetivos,
    editCumplimiento,
    setEditCumplimiento,
    editCompetencias,
    setEditCompetencias,
    editCompromisos,
    setEditCompromisos,
    editFechaRevision,
    setEditFechaRevision,
    editObservaciones,
    setEditObservaciones,
    activeView,
    setActiveView,
    goNextView,
    goPrevView,
    ponderacion,
    canEdit,
    faltaEvaluador,
    isObjetivosCompletado,
    isResponsabilidadesCompletado,
    isCompetenciasCompletado,
    step1Complete,
    step2Complete,
    step3Complete,
    viewAnimProps,
    openModal,
    hasChanges,
    closeModal,
    saveModal,
    totalSteps,
    isLastStep,
    goNext,
    goPrev,
    handleStepSelect,
    handlePorcentajeChange,
    handleEvaluadorChange,
    dateValue
  };
}
export type EvaluationFormContext = ReturnType<typeof useEvaluationForm>;
