"use client"

import { useEffect, useMemo, useState } from "react"
import {
    CalendarDays,
    Clock,
} from "lucide-react"
import { useUser, useProfile } from "@/lib/hooks"
import { DashboardAlertasProvider } from "@/components/dashboard-alertas-context"
import { CumplimientoProvider } from "@/components/dashboard-cumplimiento-context"
import DashboardAlertas from "@/components/dashboard-alertas"
import DashboardCumplimiento from "@/components/dashboard-cumplimiento"
import DashboardYearlyCompliance from "@/components/dashboard-yearly-compliance"
import RgCumplimientoChart from "@/components/rg-cumplimiento-chart"
import CapacitacionChart from "@/components/capacitacion-chart"
import TrainingHoursKPI from "@/components/training-hours-kpi"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(d: Date): string {
    return d.toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long",
    })
}

// ─── Greeting Bar ─────────────────────────────────────────────────────────────

function GreetingBar() {
    const { user } = useUser()
    const { profile } = useProfile(user?.id)
    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        setNow(new Date())
        const id = setInterval(() => setNow(new Date()), 30_000)
        return () => clearInterval(id)
    }, [])

    const timeStr = useMemo(() => (now ? formatTime(now) : ""), [now])
    const dateStr = useMemo(() => (now ? formatDate(now) : ""), [now])
    const displayName = profile?.displayName || profile?.firstName || "Bienvenido"

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight">{displayName}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-muted-foreground" aria-hidden="true" />
                    <span className="capitalize">{dateStr}</span>
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                    <Clock size={14} className="text-muted-foreground" aria-hidden="true" />
                    {timeStr}
                </span>
            </div>
        </div>
    )
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────



// ─── Dashboard Content ────────────────────────────────────────────────────────

function DashboardContent() {
    return (
        <div className="space-y-4">
            <GreetingBar />

            <div className="space-y-4">
                <DashboardAlertas />
                <TrainingHoursKPI />
                <CapacitacionChart />
                <DashboardCumplimiento />
                <RgCumplimientoChart />
                <DashboardYearlyCompliance />
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardHome() {
    return (
        <DashboardAlertasProvider>
            <CumplimientoProvider>
                <DashboardContent />
            </CumplimientoProvider>
        </DashboardAlertasProvider>
    )
}
