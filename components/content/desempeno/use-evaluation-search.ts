"use client";

import { SEARCH_OPTIONS } from "@/lib/desempeno/presentation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDesempeno } from "@/lib/hooks/useDesempeno";
import { PERIODOS_DESEMPENO, type DesempenoPeriodo } from "@/lib/catalogo";
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad";
import { UMBRAL_CALIFICACION_APROBATORIA, calcularPonderacion } from "@/lib/types/desempeno";
import { guiaYaVista } from "../desempeno-guia";
import { useRole } from "@/lib/hooks";
import { usePendingEvals } from "@/lib/hooks/usePendingEvals";
export function useEvaluationSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [numeroBuscado, setNumeroBuscado] = useState("");
  const [periodoModo, setPeriodoModo] = useState<"semestrales" | "mensuales">("semestrales");
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<DesempenoPeriodo>(PERIODOS_DESEMPENO.semestrales[0]);
  const {
    data,
    setData,
    origen,
    requiereSemestral,
    semestreObjetivo,
    fechaIngreso,
    loading,
    saving,
    saveSuccess,
    resetSaveSuccess,
    error,
    buscarEmpleado,
    buscarSugerencias,
    guardar,
    recalcularAsistencia,
    cargarEvaluacion
  } = useDesempeno();
  const {
    isEvaluador,
    departamentosScope
  } = useRole();
  const {
    totalEvals,
    totalVencidas,
    totalProximas,
    totalATiempo
  } = usePendingEvals(departamentosScope);
  const [guiaOpen, setGuiaOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Typeahead + recientes
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Array<{
    numero: string;
    nombre: string;
    puesto: string;
  }>>([]);
  const [suggLoading, setSuggLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recientes, setRecientes] = useState<Array<{
    numero: string;
    nombre: string;
  }>>([]);
  // Gate de impresión: solo se puede imprimir una evaluación ya guardada y sin ediciones posteriores.
  const savedSnapshotRef = useRef<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Cargar evaluación desde URL si existe evalId
  useEffect(() => {
    const evalId = searchParams.get('evalId');
    if (evalId && cargarEvaluacion) {
      // Legacy URL-driven flow: the editing flag must flip before the async
      // load resolves. Suppressed until this effect is refactored to a
      // render-derived state machine.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModoEdicion(true);
      cargarEvaluacion(evalId).then(result => {
        if (result?.periodo) {
          // Determinar si es mensual o semestral según el periodo cargado
          const mensuales = PERIODOS_DESEMPENO.mensuales as readonly string[];
          const semestrales = PERIODOS_DESEMPENO.semestrales as readonly string[];
          if (mensuales.includes(result.periodo)) {
            setPeriodoModo("mensuales");
            setPeriodoSeleccionado(result.periodo as DesempenoPeriodo);
          } else if (semestrales.includes(result.periodo)) {
            setPeriodoModo("semestrales");
            setPeriodoSeleccionado(result.periodo as DesempenoPeriodo);
          }
        }
        // Limpiar URL después de cargar
        router.replace('/desempeno', {
          scroll: false
        });
      });
    }
  }, [searchParams, cargarEvaluacion, router]);
  useEffect(() => {
    if (!isEvaluador) return;
    if (!guiaYaVista()) setGuiaOpen(true);
  }, [isEvaluador]);

  // Al cambiar de modo, conserva el periodo si sigue siendo válido para ese
  // modo; si no (p.ej. venías de semestral), cae al primero del modo nuevo.
  // No clobberea el periodo auto-seleccionado al cargar un empleado.
  useEffect(() => {
    setPeriodoSeleccionado(prev => (PERIODOS_DESEMPENO[periodoModo] as readonly string[]).includes(prev) ? prev : PERIODOS_DESEMPENO[periodoModo][0]);
  }, [periodoModo]);

  // Carga búsquedas recientes desde localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_OPTIONS.recentStorageKey);
      if (raw) setRecientes(JSON.parse(raw));
    } catch {/* ignore */}
  }, []);

  // Recalcula la asistencia cuando cambia el periodo seleccionado
  useEffect(() => {
    if (data && recalcularAsistencia) {
      recalcularAsistencia(periodoSeleccionado);
    }
  }, [periodoSeleccionado, recalcularAsistencia]);

  // Atajo "/" para enfocar el buscador.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounce de sugerencias (≥2 caracteres).
  useEffect(() => {
    let cancelled = false;
    const term = numeroBuscado.trim();
    if (term.length < SEARCH_OPTIONS.minLength) {
      setSuggestions([]);
      setSuggLoading(false);
      return;
    }
    setSuggLoading(true);
    setSuggestions([]);
    setActiveIdx(-1);
    const t = setTimeout(async () => {
      const res = await buscarSugerencias(term);
      if (cancelled) return;
      setSuggestions(res);
      setActiveIdx(-1);
      setSuggLoading(false);
    }, SEARCH_OPTIONS.debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [numeroBuscado, buscarSugerencias]);
  const addReciente = useCallback((item: {
    numero: string;
    nombre: string;
  }) => {
    setRecientes(prev => {
      const next = [item, ...prev.filter(r => r.numero !== item.numero)].slice(0, SEARCH_OPTIONS.recentLimit);
      try {
        localStorage.setItem("desempeno_recientes", JSON.stringify(next));
      } catch {/* ignore */}
      return next;
    });
  }, []);
  const doBuscar = useCallback(async (valor: string, nombre?: string) => {
    const v = valor.trim();
    if (!v) return;
    setShowSugg(false);
    setActiveIdx(-1);
    setModoEdicion(false); // Salir del modo edición al buscar nuevo empleado
    const res = await buscarEmpleado(v, departamentosScope, periodoSeleccionado);
    if (res) {
      // Auto-selecciona el modo/periodo correcto según el origen del empleado:
      // planta → Semestral, nuevo ingreso → Mensual (con auto-avance de semestre).
      setPeriodoModo(res.modo);
      setPeriodoSeleccionado(res.periodo as DesempenoPeriodo);
    }
    addReciente({
      numero: v,
      nombre: nombre ?? ""
    });
  }, [buscarEmpleado, departamentosScope, periodoSeleccionado, addReciente]);

  // Realizar búsqueda inicial si existe el parámetro 'q'
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setNumeroBuscado(q);
      doBuscar(q);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('q');
      router.replace(`/desempeno?${newParams.toString()}`, {
        scroll: false
      });
    }
  }, [searchParams, router, doBuscar]);
  const handleSearch = () => doBuscar(numeroBuscado);
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSugg(true);
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = showSugg && !suggLoading && activeIdx >= 0 ? suggestions[activeIdx] : undefined;
      if (s) {
        setNumeroBuscado(s.numero);
        doBuscar(s.numero, s.nombre);
      } else {
        doBuscar(numeroBuscado);
      }
    } else if (e.key === "Escape") {
      setShowSugg(false);
      setActiveIdx(-1);
    }
  };

  // Se "ensucia" al editar o cargar otro empleado → deshabilita imprimir.
  useEffect(() => {
    if (!data) {
      savedSnapshotRef.current = null;
      setGuardado(false);
      return;
    }
    setGuardado(savedSnapshotRef.current === JSON.stringify(data));
  }, [data]);

  // Tras guardar con éxito, fija el snapshot como "limpio".
  useEffect(() => {
    if (saveSuccess && data) {
      savedSnapshotRef.current = JSON.stringify(data);
      setGuardado(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveSuccess]);
  const ponderacion = data ? calcularPonderacion(data) : null;
  const requiereCompromisos = ponderacion !== null && ponderacion.calificacionFinal < UMBRAL_CALIFICACION_APROBATORIA;
  const tieneCompromisos = !!data?.compromisos?.trim();
  const bloqueado = requiereCompromisos && !tieneCompromisos;
  const faltaEvaluador = data ? !data.evaluador_nombre : false;

  // Elegibilidad por antigüedad para evaluaciones semestrales.
  // Empleados con < 2 meses respecto al fin del periodo no son evaluables.
  const periodoEvaluacion = data?.periodo || periodoSeleccionado;
  const elegibilidad = data ? esElegibleParaPeriodo(fechaIngreso, periodoEvaluacion) : {
    elegible: true,
    motivo: "",
    cutoff: null,
    reglaAplica: false
  };
  const noElegible = elegibilidad.reglaAplica && !elegibilidad.elegible;

  // Guardrail de periodo según origen del empleado:
  //  - planta YA elegible para el semestre activo en modo Mensual → ERROR
  //    (bloquea guardar/imprimir). Planta recién ingresado (no elegible) NO se
  //    bloquea: se evalúa mensual como onboarding hasta cumplir antigüedad.
  //  - nuevo ingreso en modo Semestral → aviso suave (no bloquea).
  const mismatchBloqueo = requiereSemestral && periodoModo === "mensuales";
  const mismatchSuave = origen === "nuevo_ingreso" && periodoModo === "semestrales";
  const periodoSemestralObjetivo = semestreObjetivo ?? PERIODOS_DESEMPENO.semestrales[0];
  return {
    searchParams,
    router,
    numeroBuscado,
    setNumeroBuscado,
    periodoModo,
    setPeriodoModo,
    periodoSeleccionado,
    setPeriodoSeleccionado,
    data,
    setData,
    origen,
    requiereSemestral,
    semestreObjetivo,
    fechaIngreso,
    loading,
    saving,
    saveSuccess,
    resetSaveSuccess,
    error,
    buscarEmpleado,
    buscarSugerencias,
    guardar,
    recalcularAsistencia,
    cargarEvaluacion,
    isEvaluador,
    departamentosScope,
    totalEvals,
    totalVencidas,
    totalProximas,
    totalATiempo,
    guiaOpen,
    setGuiaOpen,
    modoEdicion,
    setModoEdicion,
    inputRef,
    suggestions,
    setSuggestions,
    suggLoading,
    setSuggLoading,
    showSugg,
    setShowSugg,
    activeIdx,
    setActiveIdx,
    recientes,
    setRecientes,
    savedSnapshotRef,
    guardado,
    setGuardado,
    addReciente,
    doBuscar,
    handleSearch,
    onInputKeyDown,
    ponderacion,
    requiereCompromisos,
    tieneCompromisos,
    bloqueado,
    faltaEvaluador,
    periodoEvaluacion,
    elegibilidad,
    noElegible,
    mismatchBloqueo,
    mismatchSuave,
    periodoSemestralObjetivo
  };
}
export type EvaluationSearchContext = ReturnType<typeof useEvaluationSearch>;
