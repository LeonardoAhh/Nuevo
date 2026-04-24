"use client"

import { CheckCircle2 } from "lucide-react"
import type { EvalItem, FechaItem } from "@/lib/hooks/useDashboardAlertas"
import { DeptoHeader, FilaEval, FilaFecha } from "./shared"
import { MasterDetailEvals, MasterDetailFechas } from "./desktop-master-detail"
import { MobileStackEvals, MobileStackFechas } from "./mobile-stack"
import { agruparPorDepto } from "./utils"

// ─── Lista compuesta: Evaluaciones ───────────────────────────────────────────
// Cambia de presentación según viewport:
//  <sm         → MobileStackEvals (lista → detalle stack)
//  sm – lg     → lista agrupada por depto
//  lg+         → MasterDetailEvals (dos paneles)

export function ListaEvals({ items, vencida, vacio, onCalificar }: {
  items: EvalItem[]
  vencida: boolean
  vacio: string
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }

  const grupos = agruparPorDepto(items)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <MobileStackEvals items={items} vencida={vencida} onCalificar={onCalificar} />
      </div>

      <div className="hidden space-y-3 sm:block lg:hidden">
        {grupos.map(([depto, miembros]) => (
          <div key={depto}>
            <DeptoHeader nombre={depto} count={miembros.length} />
            <div className="mt-1.5 space-y-2">
              {miembros.map((item) => (
                <FilaEval
                  key={item.id}
                  item={item}
                  colorAvatar={vencida ? "bg-red-500" : "bg-amber-500"}
                  colorDias={vencida ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"}
                  colorBadge={vencida
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
                  colorBorde={vencida ? "border-red-400" : "border-amber-400"}
                  badgeLabel={vencida ? "Vencida" : "Por vencer"}
                  onCalificar={onCalificar}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <MasterDetailEvals items={items} vencida={vencida} onCalificar={onCalificar} />
      </div>
    </>
  )
}

// ─── Lista compuesta: RG / Término contrato ──────────────────────────────────

export function ListaFechasPorDepto({
  items, vacio,
  colorAvatar, colorBadge, colorDias, colorBorde,
  onEntregado, onIndeterminado,
}: {
  items: FechaItem[]; vacio: string
  colorAvatar: string; colorBadge: string; colorDias: string; colorBorde: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }

  const grupos = agruparPorDepto(items)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <MobileStackFechas
          items={items}
          colorBadge={colorBadge}
          colorDias={colorDias}
          onEntregado={onEntregado}
          onIndeterminado={onIndeterminado}
        />
      </div>

      <div className="hidden space-y-3 sm:block lg:hidden">
        {grupos.map(([depto, miembros]) => (
          <div key={depto}>
            <DeptoHeader nombre={depto} count={miembros.length} />
            <div className="space-y-2 mt-1.5">
              {miembros.map((item) => (
                <FilaFecha key={item.id} item={item}
                  colorAvatar={colorAvatar}
                  colorBadge={colorBadge}
                  colorDias={colorDias}
                  colorBorde={colorBorde}
                  onEntregado={onEntregado}
                  onIndeterminado={onIndeterminado}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <MasterDetailFechas
          items={items}
          colorBadge={colorBadge}
          colorDias={colorDias}
          onEntregado={onEntregado}
          onIndeterminado={onIndeterminado}
        />
      </div>
    </>
  )
}
