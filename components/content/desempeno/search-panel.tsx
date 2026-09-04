"use client";

import { useId } from "react";
import { DESEMPENO, SEARCH_OPTIONS } from "@/lib/desempeno/presentation";
import { SectionTitle } from "./presentation";
import { Search, Printer, Save, Loader2, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PERIODOS_DESEMPENO, type DesempenoPeriodo } from "@/lib/catalogo";
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno";
import type { EvaluationSearchContext } from "./use-evaluation-search";
import { ActionButton } from "./search-controls";
export function SearchPanel({
  context
}: {
  context: EvaluationSearchContext;
}) {
  const searchId = useId();
  const listId = `${searchId}-options`;
  const expanded = context.showSugg && context.numeroBuscado.trim().length >= SEARCH_OPTIONS.minLength;
  const {
    loading,
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
    saving,
    guardar,
    modoEdicion,
    inputRef,
    suggestions,
    setSuggestions,
    suggLoading,
    setShowSugg,
    activeIdx,
    setActiveIdx,
    recientes,
    guardado,
    doBuscar,
    handleSearch,
    onInputKeyDown,
    bloqueado,
    faltaEvaluador,
    noElegible,
    mismatchBloqueo
  } = context;
  return <Card>
    <CardHeader className="pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SectionTitle>{DESEMPENO.search.title}</SectionTitle>
          {modoEdicion && data && <Badge variant="default" className="text-xs">
              Editando
          </Badge>}
        </div>

        {/* ── Barra de acciones ────────────────────────────────────── */}
        {data && <div className="flex flex-wrap items-center gap-2">
            <ActionButton icon={<X className="h-3.5 w-3.5" />} label="Cerrar" tooltip="Descartar y volver al buscador" onClick={() => {
              setData(null);
              setNumeroBuscado("");
              const newParams = new URLSearchParams(searchParams.toString());
              newParams.delete('q');
              router.replace(`/desempeno?${newParams.toString()}`, {
                scroll: false
              });
            }} variant="outline" className="text-foreground" />

            <ActionButton icon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} label="Guardar" tooltip={faltaEvaluador ? "Selecciona un evaluador primero" : mismatchBloqueo ? "Empleado de planta: evalúalo en modo Semestral, no Mensual" : noElegible ? "Empleado no elegible para este periodo semestral (< 2 meses)" : bloqueado ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)` : "Guardar evaluación"} onClick={() => guardar({
              ...data,
              periodo: data.periodo || periodoSeleccionado
            })} disabled={loading || saving || bloqueado || noElegible || mismatchBloqueo || faltaEvaluador} variant="outline" />

            <ActionButton icon={<Printer className="h-3.5 w-3.5" />} label="Imprimir" tooltip={faltaEvaluador ? "Selecciona un evaluador primero" : mismatchBloqueo ? "Empleado de planta: evalúalo en modo Semestral, no Mensual" : noElegible ? "Empleado no elegible para este periodo semestral (< 2 meses)" : bloqueado ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)` : !guardado ? "Guarda la evaluación primero para poder imprimir" : "Imprimir evaluación"} onClick={() => window.print()} disabled={loading || !guardado || bloqueado || noElegible || mismatchBloqueo || faltaEvaluador} variant="default" />
        </div>}
      </div>
    </CardHeader>

    <CardContent className="pb-4 pt-3">
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        {/* Campo de búsqueda */}
        <div className="flex gap-2 flex-1 w-full min-w-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input ref={inputRef} value={numeroBuscado} onChange={e => {
              setNumeroBuscado(e.target.value);
              setShowSugg(true);
            }} onFocus={() => setShowSugg(true)} onBlur={() => setShowSugg(false)} onKeyDown={onInputKeyDown} disabled={loading} placeholder={DESEMPENO.search.placeholder} aria-label={DESEMPENO.search.label} aria-describedby={`${searchId}-help`} aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && !suggLoading && suggestions[activeIdx] ? `${listId}-${activeIdx}` : undefined} className="pl-9 pr-9" autoComplete="off" role="combobox" aria-expanded={expanded} aria-autocomplete="list" />
            {numeroBuscado && <button type="button" onClick={() => {
              setNumeroBuscado("");
              setSuggestions([]);
              inputRef.current?.focus();
            }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar búsqueda">
              <X className="h-4 w-4" />
            </button>}

            {/* Dropdown de sugerencias */}
            {expanded && <div id={listId} role="listbox" aria-label={DESEMPENO.search.label} aria-busy={suggLoading} className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
              {suggLoading ? <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
              </div> : suggestions.length === 0 ? <div className="px-3 py-2 text-sm text-muted-foreground">Sin coincidencias</div> : suggestions.map((s, idx) => <button key={s.numero} type="button" id={`${listId}-${idx}`} role="option" tabIndex={-1} aria-selected={idx === activeIdx} onMouseDown={e => e.preventDefault()} onClick={() => {
                setNumeroBuscado(s.numero);
                doBuscar(s.numero, s.nombre);
              }} onMouseEnter={() => setActiveIdx(idx)} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${idx === activeIdx ? "bg-accent" : "hover:bg-accent"}`}>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{s.numero}</span>
                  <span className="font-medium truncate">{s.nombre || "—"}</span>
                  {s.puesto && <span className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">{s.puesto}</span>}
                </button>)}
            </div>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleSearch} aria-label="Buscar empleado" disabled={loading || !numeroBuscado.trim()} className="shrink-0 px-4">
                <Search className="h-4 w-4" />
                <span className="sr-only">Buscar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar empleado</TooltipContent>
          </Tooltip>
        </div>

        {/* Controles de Periodo y Buscar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full xl:w-auto shrink-0">
          <div className="flex bg-muted/60 p-1 rounded-lg shrink-0 w-full sm:w-auto">
            {(["semestrales", "mensuales"] as const).map(modo => <button key={modo} type="button" onClick={() => setPeriodoModo(modo)} aria-pressed={periodoModo === modo} className={`flex-1 sm:flex-none h-8 px-4 flex items-center justify-center text-sm font-medium rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${periodoModo === modo ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"}`}>
                {DESEMPENO.modes[modo]}
              </button>)}
          </div>

          <div className="w-full sm:w-44 shrink-0">
            <Select value={periodoSeleccionado} onValueChange={value => setPeriodoSeleccionado(value as DesempenoPeriodo)}>
              <SelectTrigger aria-label={DESEMPENO.search.period}>
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS_DESEMPENO[periodoModo].map(periodo => <SelectItem key={periodo} value={periodo}>
                    {periodo}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      <p id={`${searchId}-help`} className="mt-3 text-xs leading-relaxed text-muted-foreground">{DESEMPENO.search.help}</p>
      {/* Búsquedas recientes */}
      {!numeroBuscado && recientes.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> Recientes:
        </span>
        {recientes.map(r => <button key={r.numero} type="button" onClick={() => {
          setNumeroBuscado(r.numero);
          doBuscar(r.numero, r.nombre);
        }} className="rounded-md border bg-muted/60 px-2.5 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors" title={`${r.numero}${r.nombre ? " · " + r.nombre : ""}`}>
            {r.nombre || r.numero}
          </button>)}
      </div>}
    </CardContent>
  </Card>;
}
