"use client";

import { useId } from "react";
import { DESEMPENO, SEARCH_OPTIONS } from "@/lib/desempeno/presentation";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { esPeriodoSemestral } from "@/lib/desempeno/elegibilidad";
import type { EvaluationSearchContext } from "./use-evaluation-search";
import { ActionButton } from "./search-controls";
export function SearchPanel({
  context
}: {
  context: EvaluationSearchContext;
}) {
  const searchId = useId();
  const listId = `${searchId}-options`;
  const searchLength = context.numeroBuscado.trim().length;
  const expanded = context.showSugg && searchLength >= SEARCH_OPTIONS.minLength;
  const showMinLengthHint = context.showSugg && searchLength > 0 && searchLength < SEARCH_OPTIONS.minLength;
  const {
    loading,
    numeroBuscado,
    setNumeroBuscado,
    periodoVisible,
    data,
    existingEvaluation,
    inputRef,
    suggestions,
    setSuggestions,
    suggLoading,
    setShowSugg,
    activeIdx,
    setActiveIdx,
    closeEvaluation,
    doBuscar,
    onInputKeyDown,
  } = context;
  return <Card>
    <CardContent className="pb-4 pt-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
        {/* Campo de búsqueda */}
        <div className="flex w-full min-w-0 gap-2 md:col-start-1 md:row-start-1">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input ref={inputRef} value={numeroBuscado} enterKeyHint="search" onChange={e => {
              setNumeroBuscado(e.target.value);
              setShowSugg(true);
            }} onFocus={() => setShowSugg(true)} onBlur={() => setShowSugg(false)} onKeyDown={onInputKeyDown} disabled={loading} placeholder={DESEMPENO.search.placeholder} aria-label={DESEMPENO.search.label} aria-describedby={`${searchId}-help`} aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && !suggLoading && suggestions[activeIdx] ? `${listId}-${activeIdx}` : undefined} className="min-h-11 pl-9 pr-11 font-normal leading-5" autoComplete="off" role="combobox" aria-expanded={expanded} aria-autocomplete="list" />
            {numeroBuscado && <button type="button" disabled={loading} onClick={() => {
              setNumeroBuscado("");
              setSuggestions([]);
              inputRef.current?.focus();
            }} className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50" aria-label="Limpiar búsqueda">
              <X className="h-4 w-4" />
            </button>}

            {showMinLengthHint && <div role="status" className="absolute z-20 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-sm">
              {DESEMPENO.search.help}
            </div>}

            {/* Dropdown de sugerencias */}
            {expanded && <div id={listId} role="listbox" aria-label={DESEMPENO.search.label} aria-busy={suggLoading} className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-[0_2px_2px_hsl(0_0%_0%/0.04),0_8px_16px_-4px_hsl(0_0%_0%/0.10)]">
              {suggLoading ? <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
              </div> : suggestions.length === 0 ? <div className="px-3 py-2 text-sm text-muted-foreground">Sin coincidencias</div> : suggestions.map((s, idx) => <button key={s.numero} type="button" id={`${listId}-${idx}`} role="option" tabIndex={-1} aria-selected={idx === activeIdx} onMouseDown={e => e.preventDefault()} onClick={() => {
                setNumeroBuscado(s.numero);
                doBuscar(s.numero);
              }} onMouseEnter={() => setActiveIdx(idx)} className={`flex w-full items-center gap-2 px-3 py-2 text-left font-sans ${idx === activeIdx ? "bg-accent" : "hover:bg-accent"}`}>
                  <span className="shrink-0 text-xs font-normal leading-4 tabular-nums text-muted-foreground">{s.numero}</span>
                  <span className="min-w-0 truncate text-sm font-medium leading-5 text-foreground">{s.nombre || "—"}</span>
                  {s.puesto && <span className="ml-auto max-w-[40%] truncate text-xs font-normal leading-4 text-muted-foreground">{s.puesto}</span>}
                </button>)}
            </div>}
          </div>
        </div>

        {/* El periodo vigente se asigna al buscar; los históricos se abren desde Historial. */}
        <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 md:col-span-2 md:row-start-2 xl:col-span-1 xl:col-start-2 xl:row-start-1" role="status" aria-live="polite">
          <span className="shrink-0 text-sm text-muted-foreground">Periodo</span>
          <span className="min-w-0 truncate text-sm font-medium text-foreground" title={periodoVisible ?? undefined}>
            {periodoVisible ? `${esPeriodoSemestral(periodoVisible) ? DESEMPENO.modes.semestrales : DESEMPENO.modes.mensuales} · ${periodoVisible}` : loading ? "Buscando…" : "Se asigna automáticamente"}
          </span>
        </div>
        {(data || existingEvaluation) && <div className="flex shrink-0 items-center gap-2 max-md:justify-end md:col-start-2 md:row-start-1 xl:col-start-3">
          <ActionButton icon={<X className="h-3.5 w-3.5" />} label="Cerrar" tooltip="Cerrar evaluación" onClick={closeEvaluation} variant="outline" className="text-foreground" />
        </div>}
      </div>

      <p id={`${searchId}-help`} className="sr-only">{DESEMPENO.search.help}</p>
    </CardContent>
  </Card>;
}
