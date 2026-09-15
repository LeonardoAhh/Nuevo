"use client";

import { SEARCH_OPTIONS } from "@/lib/desempeno/presentation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDesempeno } from "@/lib/hooks/useDesempeno";
import { getPeriodoActual, getPeriodosDesempeno, normalizarPeriodoDesempeno, type DesempenoPeriodo } from "@/lib/catalogo";
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad";
import { UMBRAL_CALIFICACION_APROBATORIA, calcularPonderacion } from "@/lib/types/desempeno";
import { guiaYaVista } from "../desempeno-guia";
import { useRole } from "@/lib/hooks";
import { usePendingEvals } from "@/lib/hooks/usePendingEvals";
import { confirm } from "@/components/ui/confirm-dialog";
export function useEvaluationSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [numeroBuscado, setNumeroBuscado] = useState("");
  const [periodoModo, setPeriodoModo] = useState<"semestrales" | "mensuales">("semestrales");
  const [periodoYear, setPeriodoYear] = useState(() => Number(getPeriodoActual("semestrales").match(/(\d{4})$/)?.[1]) || new Date().getFullYear());
  const periodosDisponibles = useMemo(() => getPeriodosDesempeno(periodoYear), [periodoYear]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<DesempenoPeriodo>(() => getPeriodoActual("semestrales"));
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
  const baselineSnapshotRef = useRef<string | null>(null);
  const baselineKeyRef = useRef<string | null>(null);
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
          const year = Number(result.periodo.match(/(\d{4})$/)?.[1]);
          if (year) {
            const delYear = getPeriodosDesempeno(year);
            const normalizado = normalizarPeriodoDesempeno(result.periodo);
            const modo = delYear.semestrales.some(p => normalizarPeriodoDesempeno(p) === normalizado) ? "semestrales" : "mensuales";
            setPeriodoYear(year);
            setPeriodoModo(modo);
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
    const currentMonth = new Date().getMonth();
    const fallback = periodoModo === "mensuales"
      ? periodosDisponibles.mensuales[currentMonth]
      : periodosDisponibles.semestrales[currentMonth <= 4 || currentMonth === 11 ? 0 : 1];
    setPeriodoSeleccionado(prev => periodosDisponibles[periodoModo].some(p => normalizarPeriodoDesempeno(p) === normalizarPeriodoDesempeno(prev)) ? prev : fallback);
  }, [periodoModo, periodoYear, periodosDisponibles]);

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

  const identityKey = data ? `${data.numero_empleado}:${normalizarPeriodoDesempeno(data.periodo)}` : null;
  useEffect(() => {
    if (!data || !identityKey) {
      baselineKeyRef.current = null;
      baselineSnapshotRef.current = null;
      return;
    }
    if (loading) return;
    if (baselineKeyRef.current !== identityKey) {
      baselineKeyRef.current = identityKey;
      baselineSnapshotRef.current = JSON.stringify(data);
    }
  }, [data, identityKey, loading]);
  const hasUnsavedChanges = Boolean(!loading && data && baselineSnapshotRef.current && JSON.stringify(data) !== baselineSnapshotRef.current && !guardado);

  const confirmDiscard = useCallback(async () => {
    if (!hasUnsavedChanges) return true;
    return confirm({
      title: "Cambios sin guardar",
      description: "Si continúas, se perderá la captura que todavía no has guardado.",
      confirmLabel: "Descartar cambios",
      cancelLabel: "Seguir capturando",
      tone: "warning",
    });
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.origin !== window.location.origin || anchor.href === window.location.href) return;
      event.preventDefault();
      void confirmDiscard().then(confirmed => {
        if (confirmed) router.push(`${anchor.pathname}${anchor.search}${anchor.hash}`);
      });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [confirmDiscard, hasUnsavedChanges, router]);

  const closeEvaluation = useCallback(async () => {
    if (!(await confirmDiscard())) return;
    setData(null);
    setNumeroBuscado("");
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("q");
    router.replace(newParams.size ? `/desempeno?${newParams.toString()}` : "/desempeno", { scroll: false });
  }, [confirmDiscard, router, searchParams, setData]);

  const changePeriodo = useCallback(async (periodo: string) => {
    if (periodo === periodoSeleccionado) return;
    if (!(await confirmDiscard())) return;
    if (data && !(await buscarEmpleado(data.numero_empleado, departamentosScope, periodo, true))) return;
    setPeriodoSeleccionado(periodo);
  }, [buscarEmpleado, confirmDiscard, data, departamentosScope, periodoSeleccionado]);

  const changePeriodoYear = useCallback(async (year: number) => {
    if (!(await confirmDiscard())) return;
    const next = getPeriodosDesempeno(year)[periodoModo];
    const currentMonth = new Date().getMonth();
    const periodo = periodoModo === "mensuales" ? next[currentMonth] : next[currentMonth <= 4 || currentMonth === 11 ? 0 : 1];
    if (data && !(await buscarEmpleado(data.numero_empleado, departamentosScope, periodo, true))) return;
    setPeriodoYear(year);
    setPeriodoSeleccionado(periodo);
  }, [buscarEmpleado, confirmDiscard, data, departamentosScope, periodoModo]);

  const guardedSearch = useCallback(async (valor: string, nombre?: string) => {
    if (!(await confirmDiscard())) return;
    await doBuscar(valor, nombre);
  }, [confirmDiscard, doBuscar]);

  const changePeriodoModo = useCallback(async (modo: "semestrales" | "mensuales") => {
    if (modo === periodoModo || !(await confirmDiscard())) return;
    const currentPeriod = getPeriodoActual(periodoModo);
    const followsCurrentPeriod = normalizarPeriodoDesempeno(periodoSeleccionado) === normalizarPeriodoDesempeno(currentPeriod);
    const currentMonth = new Date().getMonth();
    const options = getPeriodosDesempeno(periodoYear)[modo];
    const periodo = followsCurrentPeriod
      ? getPeriodoActual(modo)
      : modo === "mensuales" ? options[currentMonth] : options[currentMonth <= 4 || currentMonth === 11 ? 0 : 1];
    if (data && !(await buscarEmpleado(data.numero_empleado, departamentosScope, periodo, true))) return;
    const nextYear = Number(periodo.match(/(\d{4})$/)?.[1]);
    if (nextYear) setPeriodoYear(nextYear);
    setPeriodoModo(modo);
    setPeriodoSeleccionado(periodo);
  }, [buscarEmpleado, confirmDiscard, data, departamentosScope, periodoModo, periodoYear]);

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
        guardedSearch(s.numero, s.nombre);
      } else {
        guardedSearch(numeroBuscado);
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
      baselineSnapshotRef.current = JSON.stringify(data);
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
  // Empleados con menos de 3 meses respecto al fin del periodo no son evaluables.
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
  const periodoSemestralObjetivo = semestreObjetivo ?? periodosDisponibles.semestrales[0];
  return {
    searchParams,
    router,
    numeroBuscado,
    setNumeroBuscado,
    periodoModo,
    setPeriodoModo: changePeriodoModo,
    periodoSeleccionado,
    setPeriodoSeleccionado,
    periodoYear,
    periodosDisponibles,
    changePeriodo,
    changePeriodoYear,
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
    hasUnsavedChanges,
    confirmDiscard,
    closeEvaluation,
    addReciente,
    doBuscar: guardedSearch,
    handleSearch: () => guardedSearch(numeroBuscado),
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
