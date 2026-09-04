"use client";

import { SectionTitle } from "./presentation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SavedEvaluationsContext } from "./use-saved-evaluations";
export function PositionSelector({
  context
}: {
  context: SavedEvaluationsContext;
}) {
  const {
    departamentos,
    puesto,
    setPuesto,
    hasPuestoObjetivos,
    tipoLabel
  } = context;
  return <Card>
    <CardHeader className="pb-3">
      <SectionTitle>Seleccionar puesto</SectionTitle>
      <p className="text-xs text-muted-foreground">Catálogo de objetivos SMART por puesto.</p>
    </CardHeader>
    <CardContent className="space-y-3">
      <Select value={puesto} onValueChange={setPuesto}>
        <SelectTrigger aria-label="Puesto del catálogo de objetivos">
          <SelectValue placeholder="Seleccionar puesto..." />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {departamentos.map(([depto, {
            puestos
          }]) => <SelectGroup key={depto}>
              <SelectLabel>{depto}</SelectLabel>
              {puestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectGroup>)}
        </SelectContent>
      </Select>
      {puesto && <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {tipoLabel ? tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1) : ""}
        </Badge>
        <Badge variant={hasPuestoObjetivos ? "default" : "outline"}>
          {hasPuestoObjetivos ? "Objetivos definidos" : "Genérico por tipo"}
        </Badge>
      </div>}
    </CardContent>
  </Card>;
}
