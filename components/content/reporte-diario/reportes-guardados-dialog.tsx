"use client"

import { cn } from "@/lib/utils"
import { Database, ChevronRight, X, Calendar, Trash2 } from "lucide-react"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"

interface SavedSummary {
    id: string
    mes: string
    total_incidencias: number
}

interface ReportesGuardadosDialogProps {
    savedSummaries: SavedSummary[]
    dbSaving: boolean
    onLoad: (mes: string) => void
    onDelete: (id: string) => void
    formatMes: (mes: string) => string
}

export default function ReportesGuardadosDialog({
    savedSummaries,
    dbSaving,
    onLoad,
    onDelete,
    formatMes,
}: ReportesGuardadosDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Database className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Reportes guardados ({savedSummaries.length})
                        </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary shrink-0" />
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl bg-card p-0 overflow-hidden sm:rounded-2xl border-border shadow-2xl" hideClose>
                {/* Header */}
                <div className="bg-muted/40 border-b border-border px-6 py-5 flex items-center justify-between gap-4">
                    <div>
                        <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                            Reportes guardados
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Selecciona un reporte para cargarlo en pantalla.
                        </p>
                    </div>
                    <DialogClose className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-shrink-0">
                        <X className="w-5 h-5" />
                    </DialogClose>
                </div>

                {/* Lista de reportes */}
                <div className="p-5 max-h-[60vh] overflow-y-auto scrollbar-thin bg-background/50">
                    {savedSummaries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                <Database className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                No hay reportes guardados
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Guarda un reporte para verlo aquí
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                            {savedSummaries.map((s) => (
                                <div
                                    key={s.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onLoad(s.mes)}
                                    onKeyDown={(e) => { if (e.key === "Enter") onLoad(s.mes) }}
                                    className={cn(
                                        "flex items-center justify-between gap-3 rounded-xl border border-border bg-card shadow-sm px-4 py-3.5 transition-all duration-200 cursor-pointer group",
                                        "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-sm font-bold uppercase tracking-[0.08em] text-foreground block truncate">
                                                {formatMes(s.mes)}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground mt-0.5 block">
                                                Click para cargar
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Badge de incidencias */}
                                        <div className="flex flex-col items-end justify-center">
                                            <span className={cn(
                                                "text-sm font-bold leading-none tabular-nums",
                                                s.total_incidencias > 50 ? "text-destructive" : "text-foreground"
                                            )}>
                                                {s.total_incidencias}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                                                incidencias
                                            </span>
                                        </div>

                                        {/* Separador + botón eliminar */}
                                        <div className="h-8 w-px bg-border mx-1" />

                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}
                                            disabled={dbSaving}
                                            className={cn(
                                                "rounded-lg p-2 text-muted-foreground/40 transition-all duration-150",
                                                "hover:text-destructive hover:bg-destructive/10",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive",
                                                dbSaving && "opacity-50 cursor-not-allowed"
                                            )}
                                            aria-label="Eliminar reporte"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
