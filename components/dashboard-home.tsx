"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, BookOpen, CalendarDays,
  Clock, GraduationCap, Sparkles, Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser, useProfile } from "@/lib/hooks"
import { COMPANY_NAME } from "@/lib/constants/company"
import {
  DashboardAlertasProvider,
  useDashboardAlertasShared,
} from "@/components/dashboard-alertas-context"
import {
  CumplimientoProvider,
  useCumplimientoShared,
} from "@/components/dashboard-cumplimiento-context"
import { META } from "@/lib/hooks/useCumplimiento"
import DashboardAlertas from "@/components/dashboard-alertas"
import DashboardCumplimiento from "@/components/dashboard-cumplimiento"
import DashboardYearlyCompliance from "@/components/dashboard-yearly-compliance"
import RgCumplimientoChart from "@/components/rg-cumplimiento-chart"
import CapacitacionChart from "@/components/capacitacion-chart"
import NotesWidget from "@/components/notes-widget"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour < 6) return "Buenas noches"
  if (hour < 12) return "Buenos días"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  })
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent: string
  loading?: boolean
  subtitle?: string
}

function KpiCard({ icon, label, value, accent, loading, subtitle }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex items-center justify-center rounded-lg p-2.5 shrink-0 bg-muted/50"
          style={{ color: accent }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-0.5" />
          ) : (
            <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Greeting Bar ────────────────────────────────────────────────────────────

function GreetingBar() {
  const { user } = useUser()
  const { profile } = useProfile(user?.id)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const greeting = useMemo(() => (now ? getGreeting(now.getHours()) : ""), [now])
  const timeStr = useMemo(() => (now ? formatTime(now) : ""), [now])
  const dateStr = useMemo(() => (now ? formatDate(now) : ""), [now])
  const displayName = profile?.displayName || profile?.firstName || "Bienvenido"

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="outline" className="shrink-0 gap-1 text-xs px-2 py-0.5">
          <Sparkles size={12} className="text-primary" />
          {greeting}
        </Badge>
        <h2 className="text-lg font-semibold truncate">{displayName}</h2>
        <span className="hidden sm:inline text-sm text-muted-foreground">·</span>
        <span className="hidden sm:inline text-sm text-muted-foreground truncate">
          {COMPANY_NAME}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} className="text-primary/70" />
          <span className="capitalize">{dateStr}</span>
        </span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <Clock size={13} className="text-primary/70" />
          {timeStr}
        </span>
      </div>
    </div>
  )
}

// ─── KPI Strip ───────────────────────────────────────────────────────────────

function KpiStrip() {
  const { totalAlertas, loading: alertasLoading } = useDashboardAlertasShared()
  const {
    loading: cumplLoading,
    totalAsignados,
    totalAprobados,
    totalEmpleadosConPuesto,
  } = useCumplimientoShared()

  const pctGeneral = totalAsignados > 0
    ? Math.round((totalAprobados / totalAsignados) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        icon={<AlertTriangle size={18} />}
        label="Alertas pendientes"
        value={totalAlertas}
        accent="hsl(var(--destructive))"
        loading={alertasLoading}
      />
      <KpiCard
        icon={<GraduationCap size={18} />}
        label="Cumplimiento"
        value={`${pctGeneral}%`}
        accent="hsl(var(--chart-2))"
        loading={cumplLoading}
        subtitle={pctGeneral >= META ? "Cumple meta" : "Bajo meta"}
      />
      <KpiCard
        icon={<BookOpen size={18} />}
        label="Cursos aprobados"
        value={`${totalAprobados}/${totalAsignados}`}
        accent="hsl(var(--primary))"
        loading={cumplLoading}
      />
      <KpiCard
        icon={<Users size={18} />}
        label="Empleados configurados"
        value={totalEmpleadosConPuesto}
        accent="hsl(var(--chart-4))"
        loading={cumplLoading}
      />
    </div>
  )
}

// ─── Dashboard Content ───────────────────────────────────────────────────────

function DashboardContent() {
  return (
    <div className="space-y-4">
      <GreetingBar />
      <KpiStrip />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column: alertas + notas */}
        <div className="space-y-4">
          <DashboardAlertas />
          <NotesWidget />
        </div>

        {/* Right column: charts */}
        <div className="space-y-4">
          <DashboardCumplimiento />
          <RgCumplimientoChart />
          <CapacitacionChart />
          <DashboardYearlyCompliance />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DashboardHome() {
  return (
    <DashboardAlertasProvider>
      <CumplimientoProvider>
        <DashboardContent />
      </CumplimientoProvider>
    </DashboardAlertasProvider>
  )
}
