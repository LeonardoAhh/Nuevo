"use client"

import { CheckCircle2, Clock3, Ban, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { type SemestralEmployee, type SemestralDeptGroup } from "@/lib/hooks/useSemestralPendientes"
import { PendingCard, PendingCardFields, PendingCardStatus } from "./desempeno/pending-card"
import { DepartmentPage } from "./desempeno/department-page"

interface Props {
  loading: boolean
  deptGroups: SemestralDeptGroup[]
  activeTab: string | null
  direction: -1 | 1
}

function EstadoBadge({ item }: { item: SemestralEmployee }) {
  if (item.estado === "completado") {
    return (
      <PendingCardStatus tone="success" icon={<CheckCircle2 className="size-3.5" aria-hidden="true" />}>
        Completado · {item.calificacion}%
      </PendingCardStatus>
    )
  }
  if (item.estado === "no_elegible") {
    return (
      <PendingCardStatus tone="muted" icon={<Ban className="size-3.5" aria-hidden="true" />}>
        No aplica
      </PendingCardStatus>
    )
  }
  return (
    <PendingCardStatus tone="warning" icon={<Clock3 className="size-3.5" aria-hidden="true" />}>
      Pendiente
    </PendingCardStatus>
  )
}

export default function DesempenoSemestralPendientes({ loading, deptGroups, activeTab, direction }: Props) {
  const activeGroup = deptGroups.find((g) => g.departamento === activeTab) ?? deptGroups[0] ?? null

  return (
    <div className="space-y-4">
      {!loading && deptGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-8 text-muted-foreground">
          <Users className="size-6 opacity-60" aria-hidden="true" />
          <p className="text-sm font-medium">Sin personal de planta en tu área.</p>
        </div>
      )}

      {(loading || deptGroups.length > 0) && (
        <div className="space-y-4">
          {loading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : activeGroup ? (
              <DepartmentPage pageKey={activeGroup.departamento} direction={direction}>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {activeGroup.items.map((item) => (
                  <PendingCard asChild key={item.dbId}>
                    <li>
                      <PendingCardFields number={item.numero} name={item.nombre} detail={item.puesto} status={<EstadoBadge item={item} />} />
                    </li>
                  </PendingCard>
                ))}
                </ul>
              </DepartmentPage>
            ) : null}
        </div>
      )}
    </div>
  )
}
