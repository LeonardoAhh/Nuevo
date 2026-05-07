"use client"

import { useEffect, useMemo, useState } from "react"
import {
    CheckCircle2,
    ChevronDown,
    Clock,
    Settings2,
    Users,
    XCircle,
} from "lucide-react"
import { notify } from "@/lib/notify"
import { usePromociones } from "@/lib/hooks/usePromociones"
import PromocionesContent from "@/components/content/promociones"
import ReglasPromocionContent from "@/components/content/reglas-promocion"
import { Skeleton } from "@/components/ui/skeleton"
import { calcularAptitud, isHabilitado } from "@/lib/promociones/utils"
import { SummaryCard } from "@/components/content/prom-shared"

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

    const kpis = useMemo(() => {
        const habilitados = empleados.filter((e) => isHabilitado(e.puesto))
        let aptos = 0
        let noAptos = 0
        let pendientes = 0
        for (const emp of habilitados) {
            const st = calcularAptitud(emp)
            if (st === "apto") aptos++
            else if (st === "no_apto") noAptos++
            else pendientes++
        }
        return { aptos, noAptos, pendientes, total: empleados.length }
    }, [empleados])

    return (
        <div className="w-full space-y-4">

            {/* Empleados */}
            {loading && empleados.length === 0 ? (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[72px] rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-9 w-full rounded-md" />
                    <div className="hidden md:block rounded-lg border overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                    <div className="flex flex-col gap-2 md:hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[100px] rounded-xl" />
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
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
                >
                    <span className="flex items-center gap-2">
                        <Settings2 size={15} className="text-muted-foreground" />
                        Reglas de Promoción
                    </span>
                    <ChevronDown
                        size={16}
                        className={`text-muted-foreground transition-transform ${reglasOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {reglasOpen && (
                    <div className="border-t px-4 py-4">
                        <ReglasPromocionContent onChange={recargar} />
                    </div>
                )}
            </div>
        </div>
    )
}
