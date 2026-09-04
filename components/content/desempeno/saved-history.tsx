"use client";

import { SectionTitle } from "./presentation";
import { Printer, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UMBRAL_CALIFICACION_APROBATORIA } from "@/lib/types/desempeno";
import { PERIODOS_DESEMPENO } from "@/lib/catalogo";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { SavedEvaluationsContext } from "./use-saved-evaluations";
export function SavedHistory({
  context
}: {
  context: SavedEvaluationsContext;
}) {
  const {
    histSearch,
    setHistSearch,
    setSelectedNumero,
    openDeps,
    setOpenDeps,
    setShowPrintDialog,
    historialLoading,
    data,
    loading,
    bloqueado,
    gruposPorDepto
  } = context;
  return <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <SectionTitle>Historial de evaluaciones</SectionTitle>
          <CardDescription>Selecciona un empleado para consultar sus evaluaciones.</CardDescription>
        </div>
        {data && <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" className="shrink-0" onClick={() => setShowPrintDialog(true)} disabled={bloqueado} aria-label="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{bloqueado ? `Captura compromisos primero (calificación < ${UMBRAL_CALIFICACION_APROBATORIA}%)` : "Imprimir evaluación cargada"}</TooltipContent>
        </Tooltip>}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Buscar por nombre, número o periodo..." aria-label="Buscar evaluaciones guardadas por nombre, número o periodo" className="pl-9" />
      </div>

      {historialLoading ? <div className="space-y-2">
        {Array.from({
          length: 5
        }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div> : gruposPorDepto.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">
        {histSearch ? "Sin resultados." : "No hay evaluaciones guardadas."}
      </div> : <Accordion type="multiple" value={histSearch ? gruposPorDepto.map(([dep]) => dep) : openDeps} onValueChange={histSearch ? undefined : setOpenDeps} className="w-full">
        {gruposPorDepto.map(([departamento, empleados]) => <AccordionItem key={departamento} value={departamento}>
            <AccordionTrigger className="text-sm">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-left">
                <span className="font-semibold">{departamento}</span>
                <Badge variant="secondary" className="text-xs">{empleados.length} empleados</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto">
                <Table>
                  <caption className="sr-only">Evaluaciones guardadas por empleado</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="w-16">N.º</TableHead>
                      <TableHead scope="col">Nombre</TableHead>
                      <TableHead scope="col" className="hidden md:table-cell">Puesto</TableHead>
                      <TableHead scope="col" className="hidden md:table-cell">Último Periodo</TableHead>
                      <TableHead scope="col" className="text-center w-20"><span className="hidden sm:inline">Evaluaciones</span><span className="sm:hidden">Total</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleados.length === 0 ? <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No se encontraron empleados en este departamento.
                      </TableCell>
                    </TableRow> : empleados.map(e => {
                    const lastEval = e.evals[0];
                    const isSemestral = lastEval?.periodo && (PERIODOS_DESEMPENO.semestrales as readonly string[]).includes(lastEval.periodo);
                    return <TableRow key={e.numero} className="hover:bg-muted/50">
                        <TableCell className="py-2 font-mono text-xs">{e.numero}</TableCell>
                        <TableCell className="py-2 font-medium break-words">
                          <div className="flex flex-col items-start gap-1">
                            <button type="button" onClick={() => setSelectedNumero(e.numero)} className="min-h-10 w-full rounded-md text-left font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Ver evaluaciones de ${e.nombre}`}>{e.nombre}</button>
                            <span className="text-xs font-normal text-muted-foreground md:hidden">{e.puesto || "—"} · {lastEval?.periodo || "—"}</span>
                            {e.origen === "nuevo_ingreso" && <Badge variant="secondary" className="w-fit text-xs">Nuevo Ingreso</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2 text-xs leading-relaxed text-muted-foreground whitespace-normal break-words">{e.puesto || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell py-2">
                          {lastEval ? <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{lastEval.periodo}</span>
                            <Badge variant="secondary" className="text-xs">
                              {isSemestral ? "Semestral" : "Mensual"}
                            </Badge>
                          </div> : "—"}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Badge variant="outline" className="text-xs">{e.evals.length}</Badge>
                        </TableCell>
                      </TableRow>;
                  })}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>)}
      </Accordion>}

      {loading && <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Cargando evaluación...</span>
      </div>}
    </CardContent>
  </Card>;
}
