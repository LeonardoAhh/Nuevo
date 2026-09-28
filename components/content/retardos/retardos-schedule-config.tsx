"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Clock, Plus, Trash2, Settings2 } from "lucide-react"
import type { ScheduleDefinition } from "./retardos-types"

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground"

interface Props {
    schedules: ScheduleDefinition[]
    onChange: (schedules: ScheduleDefinition[]) => void
}

export default function RetardosScheduleConfig({ schedules, onChange }: Props) {
    const [expanded, setExpanded] = useState(false)

    const updateSchedule = (index: number, patch: Partial<ScheduleDefinition>) => {
        const next = schedules.map((s, i) => (i === index ? { ...s, ...patch } : s))
        onChange(next)
    }

    const toggleDay = (index: number, day: number) => {
        const s = schedules[index]
        const workDays = s.workDays.includes(day)
            ? s.workDays.filter((d) => d !== day)
            : [...s.workDays, day].sort()
        updateSchedule(index, { workDays })
    }

    const addSchedule = () => {
        const id = `custom-${Date.now()}`
        onChange([
            ...schedules,
            {
                id,
                name: `Turno ${schedules.length + 1}`,
                turnoNumber: schedules.length + 1,
                entryTime: "08:00",
                exitTime: "17:00",
                lunchMinutes: 30,
                lunchToleranceMinutes: 5,
                workDays: [1, 2, 3, 4, 5],
                toleranceMinutes: 10,
            },
        ])
    }

    const removeSchedule = (index: number) => {
        onChange(schedules.filter((_, i) => i !== index))
    }

    return (
        <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/40 border-b border-border px-5 py-4">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-between w-full"
                >
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">
                            Configuración de horarios
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({schedules.length})
                            </span>
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {expanded ? "Ocultar" : "Mostrar"}
                    </span>
                </button>
            </CardHeader>

            {expanded && (
                <CardContent className="px-3 py-4 sm:px-5 sm:py-5">
                    <div className="space-y-4">
                        {schedules.map((schedule, index) => (
                            <div
                                key={schedule.id}
                                className="rounded-xl border border-border p-4 bg-background space-y-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={schedule.name}
                                            onChange={(e) => updateSchedule(index, { name: e.target.value })}
                                            className="h-8 text-sm font-medium"
                                            placeholder="Nombre del horario"
                                        />
                                    </div>
                                    {schedules.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSchedule(index)}
                                            className="rounded-md p-1.5 text-muted-foreground/40 transition hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelCls}>No. turno</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={schedule.turnoNumber}
                                            onChange={(e) => updateSchedule(index, { turnoNumber: parseInt(e.target.value) || 1 })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Entrada</label>
                                        <Input
                                            type="time"
                                            value={schedule.entryTime}
                                            onChange={(e) => updateSchedule(index, { entryTime: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Salida</label>
                                        <Input
                                            type="time"
                                            value={schedule.exitTime}
                                            onChange={(e) => updateSchedule(index, { exitTime: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Comida (min)</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            value={schedule.lunchMinutes}
                                            onChange={(e) => updateSchedule(index, { lunchMinutes: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Tolerancia (min)</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={60}
                                            value={schedule.toleranceMinutes}
                                            onChange={(e) => updateSchedule(index, { toleranceMinutes: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className={labelCls}>Tol. comida (min)</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={60}
                                        value={schedule.lunchToleranceMinutes}
                                        onChange={(e) => updateSchedule(index, { lunchToleranceMinutes: parseInt(e.target.value) || 0 })}
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className={labelCls}>Días laborales</label>
                                    <div className="flex gap-1.5">
                                        {DAY_LABELS.map((label, dayIndex) => (
                                            <button
                                                key={dayIndex}
                                                type="button"
                                                onClick={() => toggleDay(index, dayIndex)}
                                                className={cn(
                                                    "flex items-center justify-center w-9 h-9 rounded-lg text-xs font-medium transition",
                                                    schedule.workDays.includes(dayIndex)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/60 text-muted-foreground hover:bg-muted",
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addSchedule}
                            className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar horario
                        </button>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
