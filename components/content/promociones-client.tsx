"use client"

import { useEffect, useState } from "react"
import { Settings2, Users } from "lucide-react"
import { notify } from "@/lib/notify"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePromociones } from "@/lib/hooks/usePromociones"
import PromocionesContent from "@/components/content/promociones"
import ReglasPromocionContent from "@/components/content/reglas-promocion"
import { Skeleton } from "@/components/ui/skeleton"

type TabKey = "empleados" | "reglas"

export default function PromocionesClient() {
  const {
    empleados,
    loading,
    error,
    recargar,
    guardarDesempeño,
    promoverEmpleado,
    guardarExamen,
  } = usePromociones()

  const [tab, setTab] = useState<TabKey>("empleados")
  const [mounted, setMounted] = useState<Record<TabKey, boolean>>({
    empleados: true,
    reglas: false,
  })

  useEffect(() => {
    if (error) notify.error(`Error al cargar datos: ${error}`)
  }, [error])

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const key = v as TabKey
        setTab(key)
        setMounted((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
      }}
      className="w-full space-y-4"
    >
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="empleados" className="gap-1.5 flex-1 sm:flex-none">
          <Users size={14} />
          Empleados
        </TabsTrigger>
        <TabsTrigger value="reglas" className="gap-1.5 flex-1 sm:flex-none">
          <Settings2 size={14} />
          Reglas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="empleados" className="mt-0 space-y-4">
        {loading && empleados.length === 0 ? (
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
        ) : error ? (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            Error al cargar datos: {error}
          </div>
        ) : (
          <PromocionesContent
            empleados={empleados}
            onDatosActualizados={recargar}
            guardarDesempeño={guardarDesempeño}
            promoverEmpleado={promoverEmpleado}
            guardarExamen={guardarExamen}
          />
        )}
      </TabsContent>

      <TabsContent value="reglas" className="mt-0">
        {mounted.reglas && <ReglasPromocionContent onChange={recargar} />}
      </TabsContent>
    </Tabs>
  )
}
