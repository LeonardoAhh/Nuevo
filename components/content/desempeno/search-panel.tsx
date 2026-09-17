"use client";

import { useId } from "react";
import { DESEMPENO, SEARCH_OPTIONS } from "@/lib/desempeno/presentation";
import { SectionTitle } from "./presentation";
import { Search, Loader2, X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DesempenoPeriodo } from "@/lib/catalogo";
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
    numeroBuscado,
    setNumeroBuscado,
    periodoModo,
    setPeriodoModo,
    periodoSeleccionado,
    periodoYear,
    periodosDisponibles,
    changePeriodo,
    changePeriodoYear,
    data,
    modoEdicion,
    inputRef,
    suggestions,
    setSuggestions,
    suggLoading,
    setShowSugg,
    activeIdx,
    setActiveIdx,
    recientes,
    closeEvaluation,
    doBuscar,
    handleSearch,
    onInputKeyDown,
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
            <ActionButton icon={<X className="h-3.5 w-3.5" />} label="Cerrar" tooltip="Cerrar evaluación" onClick={closeEvaluation} variant="outline" className="text-foreground" />
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
            }} onFocus={() => setShowSugg(true)} onBlur={() => setShowSugg(false)} onKeyDown={onInputKeyDown} disabled={loading} placeholder={DESEMPENO.search.placeholder} aria-label={DESEMPENO.search.label} aria-describedby={`${searchId}-help`} aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && !suggLoading && suggestions[activeIdx] ? `${listId}-${activeIdx}` : undefined} className="min-h-11 pl-9 pr-11" autoComplete="off" role="combobox" aria-expanded={expanded} aria-autocomplete="list" />
            {numeroBuscado && <button type="button" onClick={() => {
              setNumeroBuscado("");
              setSuggestions([]);
              inputRef.current?.focus();
            }} className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Limpiar búsqueda">
              <X className="h-4 w-4" />
            </button>}

            {/* Dropdown de sugerencias */}
            {expanded && <div id={listId} role="listbox" aria-label={DESEMPENO.search.label} aria-busy={suggLoading} className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-[0_2px_2px_hsl(0_0%_0%/0.04),0_8px_16px_-4px_hsl(0_0%_0%/0.10)]">
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
              <Button onClick={handleSearch} aria-label="Buscar empleado" disabled={loading || !numeroBuscado.trim()} className="min-h-11 shrink-0 px-4">
                <Search className="h-4 w-4" />
                <span className="sr-only">Buscar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar empleado</TooltipContent>
          </Tooltip>
        </div>

        {/* Controles de Periodo y Buscar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full xl:w-auto shrink-0">
          <div className="flex w-full shrink-0 rounded-md border border-border bg-muted p-1 sm:w-auto" role="group" aria-label="Frecuencia de evaluación">
            {(["semestrales", "mensuales"] as const).map(modo => <button key={modo} type="button" onClick={() => setPeriodoModo(modo)} aria-pressed={periodoModo === modo} className={`flex min-h-11 flex-1 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none ${periodoModo === modo ? "border-border bg-card text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {DESEMPENO.modes[modo]}
              </button>)}
          </div>

          <div className="flex w-full items-center justify-between gap-1 sm:w-auto" aria-label="Año de evaluación">
            <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => changePeriodoYear(periodoYear - 1)} aria-label="Año anterior"><ChevronLeft className="size-4" /></Button>
            <span className="min-w-14 text-center text-sm font-semibold tabular-nums">{periodoYear}</span>
            <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => changePeriodoYear(periodoYear + 1)} aria-label="Año siguiente"><ChevronRight className="size-4" /></Button>
          </div>
          <div className="w-full sm:w-44 shrink-0">
            <Select value={periodoSeleccionado} onValueChange={value => changePeriodo(value as DesempenoPeriodo)}>
              <SelectTrigger aria-label={DESEMPENO.search.period}>
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodosDisponibles[periodoModo].map(periodo => <SelectItem key={periodo} value={periodo}>
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
