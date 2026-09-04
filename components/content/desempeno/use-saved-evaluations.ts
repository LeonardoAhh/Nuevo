"use client";

import { useState, useMemo, useEffect } from "react";
import { DEFAULT_OBJETIVOS_POR_TIPO, calcularPonderacion, UMBRAL_CALIFICACION_APROBATORIA, type Objetivo } from "@/lib/types/desempeno";
import { OBJETIVOS_POR_PUESTO } from "@/lib/desempeno/objetivos-catalogo";
import { CATALOGO_ORGANIZACIONAL, getTipoDesempenoByPuesto, getDepartamentoByPuesto, DEPARTAMENTO_SIN_ASIGNAR } from "@/lib/catalogo";
import { useDesempeno, type EvaluacionHistorial } from "@/lib/hooks/useDesempeno";
function getObjetivosForPuesto(puesto: string): Objetivo[] {
  if (OBJETIVOS_POR_PUESTO[puesto]) {
    return OBJETIVOS_POR_PUESTO[puesto];
  }
  const tipo = getTipoDesempenoByPuesto(puesto);
  return DEFAULT_OBJETIVOS_POR_TIPO[tipo];
}
interface EmpleadoAgrupado {
  numero: string;
  nombre: string;
  puesto: string;
  departamento: string;
  evals: EvaluacionHistorial[];
  origen?: "planta" | "nuevo_ingreso";
}
export function useSavedEvaluations() {
  const departamentos = useMemo(() => Object.entries(CATALOGO_ORGANIZACIONAL), []);
  const [puesto, setPuesto] = useState("");
  const [histSearch, setHistSearch] = useState("");
  const [selectedNumero, setSelectedNumero] = useState<string | null>(null);
  const [openDeps, setOpenDeps] = useState<string[]>([]);
  const [pendingPrintId, setPendingPrintId] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const {
    historial,
    historialLoading,
    fetchHistorial,
    cargarEvaluacion,
    eliminarEvaluacion,
    data,
    loading
  } = useDesempeno();
  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);
  const objetivos = puesto ? getObjetivosForPuesto(puesto) : [];
  const hasPuestoObjetivos = puesto ? !!OBJETIVOS_POR_PUESTO[puesto] : false;
  const tipoLabel = puesto ? getTipoDesempenoByPuesto(puesto) : null;
  const requiereCompromisos = data ? calcularPonderacion(data).calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA : false;
  const tieneCompromisos = !!data?.compromisos?.trim();
  const bloqueado = requiereCompromisos && !tieneCompromisos;

  // 1 entrada por empleado, con sus evaluaciones agrupadas.
  const empleadosAgrupados = useMemo(() => {
    const byNum = new Map<string, EmpleadoAgrupado>();
    for (const ev of historial) {
      let e = byNum.get(ev.numero_empleado);
      if (!e) {
        e = {
          numero: ev.numero_empleado,
          nombre: ev.nombre ?? "—",
          puesto: ev.puesto ?? "",
          departamento: getDepartamentoByPuesto(ev.puesto),
          evals: [],
          origen: ev.origen
        };
        byNum.set(ev.numero_empleado, e);
      }
      e.evals.push(ev);
    }
    return [...byNum.values()];
  }, [historial]);
  const empleadosFiltrados = useMemo(() => {
    if (!histSearch) return empleadosAgrupados;
    const q = histSearch.toLowerCase();
    return empleadosAgrupados.filter(e => e.numero.toLowerCase().includes(q) || e.nombre.toLowerCase().includes(q) || e.puesto.toLowerCase().includes(q) || e.evals.some(ev => (ev.periodo ?? "").toLowerCase().includes(q)));
  }, [empleadosAgrupados, histSearch]);

  // Agrupado por departamento, ordenado (SIN DEPARTAMENTO al final).
  const gruposPorDepto = useMemo(() => {
    const byDep = new Map<string, EmpleadoAgrupado[]>();
    for (const e of empleadosFiltrados) {
      const arr = byDep.get(e.departamento) ?? [];
      arr.push(e);
      byDep.set(e.departamento, arr);
    }
    const entries = [...byDep.entries()].sort((a, b) => {
      if (a[0] === DEPARTAMENTO_SIN_ASIGNAR) return 1;
      if (b[0] === DEPARTAMENTO_SIN_ASIGNAR) return -1;
      return a[0].localeCompare(b[0]);
    });
    for (const [, arr] of entries) arr.sort((x, y) => x.nombre.localeCompare(y.nombre));
    return entries;
  }, [empleadosFiltrados]);
  const empleadoSel = useMemo(() => empleadosAgrupados.find(e => e.numero === selectedNumero) ?? null, [empleadosAgrupados, selectedNumero]);

  // Imprimir: carga la evaluación y prepara el modal de impresión.
  useEffect(() => {
    if (!pendingPrintId || loading || !data) return;
    const t = setTimeout(() => {
      setShowPrintDialog(true);
      setPendingPrintId(null);
    }, 150);
    return () => clearTimeout(t);
  }, [pendingPrintId, loading, data]);
  const handlePrint = (evalId: string) => {
    setPendingPrintId(evalId);
    cargarEvaluacion(evalId);
  };
  return {
    departamentos,
    puesto,
    setPuesto,
    histSearch,
    setHistSearch,
    selectedNumero,
    setSelectedNumero,
    openDeps,
    setOpenDeps,
    pendingPrintId,
    setPendingPrintId,
    showPrintDialog,
    setShowPrintDialog,
    historial,
    historialLoading,
    fetchHistorial,
    cargarEvaluacion,
    eliminarEvaluacion,
    data,
    loading,
    objetivos,
    hasPuestoObjetivos,
    tipoLabel,
    requiereCompromisos,
    tieneCompromisos,
    bloqueado,
    empleadosAgrupados,
    empleadosFiltrados,
    gruposPorDepto,
    empleadoSel,
    handlePrint
  };
}
export type SavedEvaluationsContext = ReturnType<typeof useSavedEvaluations>;
