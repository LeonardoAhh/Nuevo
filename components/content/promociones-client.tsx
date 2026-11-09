"use client"

import { useEffect, useState } from "react"
import { notify } from "@/lib/notify"
import { usePromociones } from "@/lib/hooks/usePromociones"
import PromocionesContent from "@/components/content/promociones"
import ReglasPromocionContent from "@/components/content/reglas-promocion"
import { Skeleton } from "@/components/ui/skeleton"
import { ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"

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

    const [reglasOpen, setReglasOpen] = useState(false)

    useEffect(() => {
        if (error) notify.error(`Error al cargar datos: ${error}`)
    }, [error])

    return (
        <div className="w-full space-y-4">

            {/* Empleados */}
            {loading && empleados.length === 0 ? (
                <div className="space-y-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                    <div className="hidden md:block rounded-lg border overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                    <div className="flex flex-col gap-2 md:hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-28 rounded-xl" />
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                    Error al cargar datos: {error}
                </div>
            ) : (
                <PromocionesContent
                    empleados={empleados}
                    onDatosActualizados={recargar}
                    onOpenRules={() => setReglasOpen(true)}
                    guardarDesempeño={guardarDesempeño}
                    promoverEmpleado={promoverEmpleado}
                    guardarExamen={guardarExamen}
                />
            )}

            <ResponsiveShell
                open={reglasOpen}
                onClose={() => setReglasOpen(false)}
                size="xl"
                title="Reglas de Promoción"
                description="Consulta y administra los criterios de promoción."
            >
                <ModalHeader
                    title="Reglas de Promoción"
                    onClose={() => setReglasOpen(false)}
                />
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    <ReglasPromocionContent onChange={recargar} />
                </div>
            </ResponsiveShell>
        </div>
    )
}
