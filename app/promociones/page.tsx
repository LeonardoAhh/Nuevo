"use client"

import Dashboard from "@/components/Dashboard"
import PromocionesContent from "@/components/content/promociones"
import { usePromociones } from "@/lib/hooks/usePromociones"
import { useEffect } from "react"
import { notify } from "@/lib/notify"
import { Skeleton } from "@/components/ui/skeleton"

function PromocionesWrapper() {
  const { empleados, loading, error, recargar, guardarDesempeño, promoverEmpleado, guardarExamen } = usePromociones()

  useEffect(() => {
    if (error) notify.error(`Error al cargar datos: ${error}`)
  }, [error])

  if (loading && empleados.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
        Error al cargar datos: {error}
      </div>
    )
  }

  return (
    <PromocionesContent
      empleados={empleados}
      onDatosActualizados={recargar}
      guardarDesempeño={guardarDesempeño}
      promoverEmpleado={promoverEmpleado}
      guardarExamen={guardarExamen}
    />
  )
}

export default function PromocionesPage() {
  return (
    <Dashboard
      pageTitle="Promociones"
      content={<PromocionesWrapper />}
    />
  )
}
