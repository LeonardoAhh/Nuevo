"use client"

import { cn } from "@/lib/utils"
import { CircleAlert } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { INCIDENT_TABS, INCIDENCIA_LABELS } from "./constants"
import type { IncidentTab, EmployeeRef } from "./types"

interface ReporteIncidentTabsProps {
    selectedTab: IncidentTab
    onSelectTab: (tab: IncidentTab) => void
    dayCounts: Record<IncidentTab, number>
    incidentSummary: Record<IncidentTab, EmployeeRef[]>
}

export default function ReporteIncidentTabs({
    selectedTab,
    onSelectTab,
    dayCounts,
    incidentSummary,
}: ReporteIncidentTabsProps) {
    return (
        <Tabs value={selectedTab} onValueChange={(v) => onSelectTab(v as IncidentTab)}>
            <TabsList className="flex flex-wrap gap-1.5 h-auto bg-transparent p-0 mb-4">
                {INCIDENT_TABS.map((code) => {
                    const cnt = dayCounts[code] ?? 0
                    const active = selectedTab === code
                    return (
                        <TabsTrigger
                            key={code}
                            value={code}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                                "transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                "data-[state=active]:shadow-none",
                                active
                                    ? "!border-primary !text-primary !bg-background !shadow-none ring-1 ring-primary/20"
                                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            )}
                        >
                            {INCIDENCIA_LABELS[code] ?? code}
                            <span className={cn(
                                "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none",
                                active
                                    ? "bg-primary/10 text-primary"
                                    : cnt > 0
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                        : "bg-muted text-muted-foreground/50",
                            )}>
                                {cnt}
                            </span>
                        </TabsTrigger>
                    )
                })}
            </TabsList>

            {INCIDENT_TABS.map((code) => (
                <TabsContent key={code} value={code} className="mt-0 focus-visible:outline-none">
                    {(dayCounts[code] ?? 0) > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-left">
                                        {["Empleado", "# Empleado", "Departamento", "Área", "Turno"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {incidentSummary[code].map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.nombre}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.numero_empleado}</td>
                                            <td className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">{row.departamento}</td>
                                            <td className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">{row.area}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    {row.turno}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background py-10 text-center">
                            <CircleAlert className="mb-2 w-6 h-6 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Sin registros para este criterio.</p>
                        </div>
                    )}
                </TabsContent>
            ))}
        </Tabs>
    )
}
