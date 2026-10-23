"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EvaluacionVencida } from "@/lib/desempeno/regularizacion/servicio"
import { EstadoVacioRegularizacion } from "./estado-vacio"

export function PendientesLista({ items, onSelect }: {
  items: EvaluacionVencida[]
  onSelect: (item: EvaluacionVencida) => void
}) {
  const [query, setQuery] = useState("")
  const visibles = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es")
    return term ? items.filter((item) =>
      item.numero.toLocaleLowerCase("es").includes(term)
      || item.nombre.toLocaleLowerCase("es").includes(term)
      || item.periodo.toLocaleLowerCase("es").includes(term),
    ) : []
  }, [items, query])
  const buscando = query.trim().length > 0

  return <section aria-labelledby="regularizacion-pendientes" className="space-y-4">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0">
        <h2 id="regularizacion-pendientes" className="text-lg font-semibold tracking-tight">Evaluaciones vencidas</h2>
      </div>
      <div className="w-full min-w-0 md:w-52 md:flex-none">
        <Label htmlFor="regularizacion-buscar" className="sr-only">Buscar por número, nombre o periodo</Label>
        <Input id="regularizacion-buscar" type="search" placeholder="Buscar…" value={query} onChange={event => setQuery(event.target.value)} className="h-11" />
      </div>
    </div>
    {buscando && visibles.length ? <ul className="grid gap-3 lg:grid-cols-2">
      {visibles.map((item) => <li key={`${item.numero}:${item.periodo}`}>
        <Card className="h-full"><CardContent className="flex h-full flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0 space-y-1">
            <p className="break-words font-semibold">{item.nombre}</p>
            <p className="text-sm text-muted-foreground">#{item.numero} · {item.periodo} · {item.origen === "planta" ? "Semestral" : "Nuevo ingreso"}</p>
            <p className="text-sm text-muted-foreground">Venció el <time dateTime={item.fecha_limite}>{item.fecha_limite}</time></p>
          </div>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onSelect(item)} aria-label={`Capturar ${item.periodo} de ${item.nombre}`}>
            Capturar
          </Button>
        </CardContent></Card>
      </li>) }
    </ul> : <EstadoVacioRegularizacion estado={items.length === 0 ? "sin-pendientes" : buscando ? "sin-coincidencias" : "inicio"} />}
  </section>
}
