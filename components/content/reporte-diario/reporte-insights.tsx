import { useMemo } from "react"
import { AlertTriangle, TrendingUp, CheckCircle2, Sparkles, ChevronRight } from "lucide-react"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogHeader,
} from "@/components/ui/dialog"
import { motion } from "framer-motion"
import type { ReporteRow } from "./types"

interface Props {
    selectedRows: ReporteRow[]
    dayHeaders: string[]
    dayAusentismoPct: Record<string, number>
}

export default function ReporteInsights({ selectedRows, dayHeaders, dayAusentismoPct }: Props) {
    // Analytics
    const insights = useMemo(() => {
        if (!selectedRows.length || !dayHeaders.length) return []
        
        const newInsights = []
        
        // 1. Top Offenders (Faltas)
        const offenders = selectedRows.map(row => {
            let faltas = 0
            for (const day of dayHeaders) {
                if (row.days[day] === "F") faltas++
            }
            return { row, faltas }
        }).filter(o => o.faltas >= 3).sort((a, b) => b.faltas - a.faltas)
        
        offenders.slice(0, 3).forEach(o => {
            newInsights.push({
                id: `offender-${o.row.numero_empleado}`,
                type: "danger",
                icon: AlertTriangle,
                message: `${o.row.nombre}: ${o.faltas} faltas`
            })
        })
        
        // 2. Picos de ausentismo
        // Average ausentismo
        const percentages = Object.values(dayAusentismoPct).filter(p => p > 0)
        if (percentages.length > 0) {
            const avgPct = percentages.reduce((a, b) => a + b, 0) / percentages.length
            
            // Find days that are avg + 5% or > 10% overall
            for (const day of dayHeaders) {
                const pct = dayAusentismoPct[day] || 0
                if (pct > 0 && pct >= avgPct + 5 && pct >= 10) {
                    newInsights.push({
                        id: `peak-${day}`,
                        type: "warning",
                        icon: TrendingUp,
                        message: `Día ${parseInt(day, 10)}: Ausentismo alto (${pct}%)`
                    })
                }
            }
        }
        
        return newInsights
    }, [selectedRows, dayHeaders, dayAusentismoPct])

    if (!selectedRows.length) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            insights.length > 0 ? "bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}>
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Análisis IA {insights.length > 0 && <span className="text-muted-foreground font-normal ml-1">({insights.length} alertas)</span>}
                        </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary shrink-0" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Asistente Operativo
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-2">
                    {insights.length === 0 ? (
                        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl shadow-sm">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">Operación normal, sin alertas este mes.</p>
                        </div>
                    ) : (
                        insights.map((insight) => {
                            const isDanger = insight.type === "danger"
                            const Icon = insight.icon
                            
                            return (
                                <div 
                                    key={insight.id}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors shadow-sm ${
                                        isDanger 
                                            ? "bg-destructive/5 border-destructive/20 text-destructive" 
                                            : "bg-warning/5 border-warning/20 text-warning"
                                    }`}
                                >
                                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{insight.message}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
