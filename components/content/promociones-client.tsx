"use client"

import { useEffect, useState } from "react"
import {
    ChevronDown,
    SlidersHorizontal,
} from "lucide-react"
import { notify } from "@/lib/notify"
import { usePromociones } from "@/lib/hooks/usePromociones"
import PromocionesContent from "@/components/content/promociones"
import ReglasPromocionContent from "@/components/content/reglas-promocion"
import { Skeleton } from "@/components/ui/skeleton"
import { PROMOTION_ICON } from "@/lib/promociones/icon-styles"

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
                    guardarDesempeño={guardarDesempeño}
                    promoverEmpleado={promoverEmpleado}
                    guardarExamen={guardarExamen}
                />
            )}

            {/* Reglas — sección colapsable */}
            <div className="rounded-lg border bg-background">
                <button
                    type="button"
                    onClick={() => setReglasOpen((v) => !v)}
                    aria-expanded={reglasOpen}
                    aria-controls="promotion-rules-panel"
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
                >
                    <span className="flex items-center gap-2">
                        <SlidersHorizontal aria-hidden="true" className={`${PROMOTION_ICON.control} text-muted-foreground`} />
                        Reglas de Promoción
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`${PROMOTION_ICON.control} text-muted-foreground transition-transform ${reglasOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {reglasOpen && (
                    <div id="promotion-rules-panel" className="border-t px-4 py-4">
                        <ReglasPromocionContent onChange={recargar} />
                    </div>
                )}
            </div>
        </div>
    )
}
