"use client"

import React, {
  useState,
  useMemo,
  useEffect,
  useId,
  useCallback,
  memo,
} from "react"
import {
  Copy,
  Check,
  MessageSquareShare,
  Search,
  AlertCircle,
  Download,
  Clock,
  Users,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell"
import { usePendingEvals } from "@/lib/hooks/usePendingEvals"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { notify } from "@/lib/notify"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
] as const

type Mes = typeof MESES_ES[number]

const COPY_RESET_DELAY_MS = 2_000
const WA_CHAR_LIMIT = 65_000
const SEARCH_MAX_LENGTH = 80

type TemplateType = "formal" | "informal" | "urgent"

const TEMPLATES: Record<TemplateType, { title: string; footer: string }> = {
  formal: {
    title: "*Recordatorio de Evaluaciones Pendientes*",
    footer: "_Favor de realizar las evaluaciones a la brevedad._",
  },
  informal: {
    title: "*Hola equipo, tenemos evaluaciones pendientes*",
    footer: "_Gracias por su apoyo en completar esto._",
  },
  urgent: {
    title: "*URGENTE: Evaluaciones Vencidas / Pendientes*",
    footer: "_Por favor atender esto el día de hoy sin falta._",
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvalItem {
  periodo: string
  fecha: string
  diasDiff: number
}

export interface Employee {
  dbId: string
  nombre: string
  numero?: string | number
  turno?: string
  departamento?: string
  evals: EvalItem[]
  rg_rec_048?: "Pendiente" | "Entregado"
  rg_dias_diff?: number | null
}

export interface DeptGroup {
  departamento: string
  items: Employee[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodoLabel(fechaIso: string): string {
  const month = Number(fechaIso.split("-")[1])
  const prevMonth = month === 1 ? 12 : month - 1
  return `${MESES_ES[prevMonth - 1]} – ${MESES_ES[month - 1]}`
}

function countVencidas(employees: Employee[], topic: "evals" | "rg"): number {
  if (topic === "evals") {
    return employees.reduce(
      (acc, emp) => acc + emp.evals.filter((e) => e.diasDiff < 0).length,
      0
    )
  }
  return employees.filter(
    (emp) =>
      emp.rg_rec_048 === "Pendiente" &&
      typeof emp.rg_dias_diff === "number" &&
      emp.rg_dias_diff < 0
  ).length
}

function downloadAsTxt(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatEvalStatus(diasDiff: number): string {
  if (diasDiff < 0) {
    const n = Math.abs(diasDiff)
    return `Vencida hace ${n} ${n === 1 ? "día" : "días"}`
  }
  if (diasDiff === 0) return "Vence hoy"
  return `Vence en ${diasDiff} ${diasDiff === 1 ? "día" : "días"}`
}

// ─── Message Builders ─────────────────────────────────────────────────────────

interface BuildMessageOptions {
  employees: Employee[]
  filterDept: string
  filterTurno: string
  template: TemplateType
  topic: "evals" | "rg"
}

function buildWhatsAppMessage({
  employees,
  filterDept,
  filterTurno,
  template,
  topic,
}: BuildMessageOptions): string {
  if (employees.length === 0) {
    return "No hay evaluaciones pendientes para los filtros seleccionados."
  }

  const t = TEMPLATES[template]
  const titleText =
    topic === "rg"
      ? t.title.replace(/Evaluaciones/g, "Documentos RG-REC-048")
      : t.title
  const lines: string[] = [titleText, ""]

  if (filterDept !== "all") lines.push(`*Departamento:* ${filterDept}`)
  if (filterTurno !== "all") lines.push(`*Turno:* ${filterTurno}`)
  if (filterDept !== "all" || filterTurno !== "all") lines.push("")

  const byDept = employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    const dept = emp.departamento ?? "Sin departamento"
    ;(acc[dept] ??= []).push(emp)
    return acc
  }, {})

  for (const [dept, emps] of Object.entries(byDept)) {
    if (filterDept === "all") lines.push(`*${dept}*`)
    for (const emp of emps) {
      const numStr = emp.numero ? ` (#${emp.numero})` : ""
      lines.push(`*${emp.nombre}*${numStr}`)
      if (topic === "evals") {
        for (const ev of emp.evals) {
          lines.push(`  - ${ev.periodo} (${getPeriodoLabel(ev.fecha)}): ${formatEvalStatus(ev.diasDiff)}`)
        }
      } else if (topic === "rg" && emp.rg_rec_048 === "Pendiente") {
        lines.push(`  - RG-REC-048: ${formatEvalStatus(emp.rg_dias_diff ?? 0)}`)
      }
      lines.push("")
    }
  }

  lines.push(t.footer)
  lines.push("_Capacitación_")
  return lines.join("\n")
}

function buildEmailMessage({
  employees,
  filterDept,
  filterTurno,
  template,
  topic,
}: BuildMessageOptions): string {
  if (employees.length === 0) {
    return "<p>No hay evaluaciones pendientes para los filtros seleccionados.</p>"
  }

  const t = TEMPLATES[template]
  const titleText =
    topic === "rg"
      ? t.title.replace(/Evaluaciones/g, "Documentación RG-REC-048")
      : t.title
  const titleHtml = titleText.replace(/\*(.*?)\*/g, "<strong>$1</strong>")
  const footerHtml = t.footer.replace(/_(.*?)_/g, "<em>$1</em>")

  let html = `<div style="font-family: var(--font-sans, sans-serif); line-height: 1.6; color: hsl(var(--foreground));">`
  html += `<p style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 1rem;">${titleHtml}</p>`

  if (filterDept !== "all" || filterTurno !== "all") {
    html += `<p style="margin-bottom: 1rem; font-size: 0.8125rem; color: hsl(var(--muted-foreground));">`
    if (filterDept !== "all") html += `<strong>Departamento:</strong> ${filterDept}<br>`
    if (filterTurno !== "all") html += `<strong>Turno:</strong> ${filterTurno}`
    html += `</p>`
  }

  const byDept = employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    const dept = emp.departamento ?? "Sin departamento"
    ;(acc[dept] ??= []).push(emp)
    return acc
  }, {})

  for (const [dept, emps] of Object.entries(byDept)) {
    if (filterDept === "all") {
      html += `<h3 style="margin-top: 1.25rem; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--muted-foreground));">${dept}</h3>`
    }
    html += `<ul style="list-style: none; padding: 0; margin: 0 0 1rem;">`
    for (const emp of emps) {
      const numStr = emp.numero ? ` <span style="color: hsl(var(--muted-foreground));">#${emp.numero}</span>` : ""
      html += `<li style="padding: 0.5rem 0; border-bottom: 1px solid hsl(var(--border));">`
      html += `<p style="margin: 0 0 0.25rem; font-size: 0.875rem; font-weight: 500;">${emp.nombre}${numStr}</p>`
      html += `<ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: hsl(var(--muted-foreground));">`
      if (topic === "evals") {
        for (const ev of emp.evals) {
          html += `<li>${ev.periodo} (${getPeriodoLabel(ev.fecha)}): ${formatEvalStatus(ev.diasDiff)}</li>`
        }
      } else if (topic === "rg" && emp.rg_rec_048 === "Pendiente") {
        html += `<li>RG-REC-048: ${formatEvalStatus(emp.rg_dias_diff ?? 0)}</li>`
      }
      html += `</ul></li>`
    }
    html += `</ul>`
  }

  html += `<p style="margin-top: 1.5rem; font-size: 0.8125rem; color: hsl(var(--muted-foreground));">${footerHtml}<br><em>Capacitación</em></p>`
  html += `</div>`
  return html
}

// ─── SegmentControl: reemplaza los dos Tabs por un control compacto ───────────

interface SegmentControlProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: { value: T; label: string }[]
  ariaLabel: string
}

function SegmentControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
}: SegmentControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="
        inline-flex w-full items-center
        rounded-lg border border-border/60
        bg-muted/40 p-0.5 gap-0.5
      "
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── FilterBar ─────────────────────────────────────────────────────────────────
// En móvil: colapsable. En desktop: siempre visible como fila.

interface FilterBarProps {
  filterDept: string
  setFilterDept: (v: string) => void
  filterTurno: string
  setFilterTurno: (v: string) => void
  urgencySort: boolean
  setUrgencySort: (v: boolean) => void
  departments: string[]
  turnos: string[]
}

const FilterBar = memo(function FilterBar({
  filterDept, setFilterDept,
  filterTurno, setFilterTurno,
  urgencySort, setUrgencySort,
  departments, turnos,
}: FilterBarProps) {
  const [open, setOpen] = useState(false)

  const activeFilters = [
    filterDept !== "all",
    filterTurno !== "all",
    urgencySort,
  ].filter(Boolean).length

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
      {/* Header del panel – siempre visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2.5",
          "text-sm font-medium transition-colors",
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          "sm:hidden" // En desktop mostramos los filtros directamente
        )}
        aria-expanded={open}
        aria-controls="filter-panel"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filtros
          {activeFilters > 0 && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        }
      </button>

      {/* Contenido de filtros */}
      <div
        id="filter-panel"
        className={cn(
          "px-3 pb-3 pt-1 grid gap-2",
          "sm:grid sm:grid-cols-3 sm:items-end sm:pt-2.5",
          // Móvil: oculto por defecto, visible cuando open
          "max-sm:transition-all max-sm:duration-200",
          open ? "max-sm:block" : "max-sm:hidden sm:block"
        )}
      >
        {/* Departamento */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Departamento</Label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="h-8 w-full bg-muted/50 border-border/50 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Todos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Turno */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Turno</Label>
          <Select value={filterTurno} onValueChange={setFilterTurno}>
            <SelectTrigger className="h-8 w-full bg-muted/50 border-border/50 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Todos</SelectItem>
              {turnos.map((t) => (
                <SelectItem key={t} value={t}>Turno {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priorizar vencidas */}
        <div className="flex items-center gap-2 h-8">
          <Switch
            id="urgency-sort"
            checked={urgencySort}
            onCheckedChange={setUrgencySort}
            aria-describedby="urgency-sort-desc"
          />
          <Label htmlFor="urgency-sort" className="text-xs cursor-pointer whitespace-nowrap text-muted-foreground">
            Priorizar vencidas
          </Label>
          <span id="urgency-sort-desc" className="sr-only">
            Mueve al inicio a los empleados con evaluaciones vencidas
          </span>
        </div>
      </div>
    </div>
  )
})

// ─── EmployeeRow ───────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  employee: Employee
  selected: boolean
  onToggle: (id: string) => void
  topic: "evals" | "rg"
}

const EmployeeRow = memo(function EmployeeRow({
  employee, selected, onToggle, topic,
}: EmployeeRowProps) {
  const hasVencida =
    topic === "evals"
      ? employee.evals.some((e) => e.diasDiff < 0)
      : typeof employee.rg_dias_diff === "number" && employee.rg_dias_diff < 0

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md transition-colors cursor-pointer",
        "hover:bg-muted/50",
        selected && "bg-muted/30"
      )}
      role="listitem"
      onClick={() => onToggle(employee.dbId)}
    >
      <Checkbox
        id={`emp-${employee.dbId}`}
        checked={selected}
        onCheckedChange={() => onToggle(employee.dbId)}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
        aria-label={`Incluir a ${employee.nombre}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">
          {employee.nombre}
          {employee.numero && (
            <span className="text-muted-foreground font-normal ml-1.5 text-xs">
              #{employee.numero}
            </span>
          )}
        </p>
        {(employee.departamento || employee.turno) && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {[employee.departamento, employee.turno ? `T${employee.turno}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
      {hasVencida && (
        <Badge variant="destructive" className="text-[10px] shrink-0 h-4 px-1.5">
          Vencida
        </Badge>
      )}
    </div>
  )
})

// ─── EmployeePanel ─────────────────────────────────────────────────────────────

interface EmployeePanelProps {
  employees: Employee[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  topic: "evals" | "rg"
  searchQuery: string
  setSearchQuery: (q: string) => void
}

const EmployeePanel = memo(function EmployeePanel({
  employees, selectedIds, onToggle, onToggleAll, topic, searchQuery, setSearchQuery,
}: EmployeePanelProps) {
  const toggleAllId = useId()
  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e.dbId))
  const someSelected = employees.some((e) => selectedIds.has(e.dbId))

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
      {/* Búsqueda + toggle all */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id="search-emp"
            type="search"
            placeholder="Buscar por nombre o número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={SEARCH_MAX_LENGTH}
            className="pl-8 h-7 bg-transparent border-transparent focus-visible:border-border text-sm placeholder:text-muted-foreground/60"
            aria-label="Buscar empleado"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Checkbox
            id={toggleAllId}
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={onToggleAll}
            aria-label={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
          />
          <label htmlFor={toggleAllId} className="text-xs text-muted-foreground cursor-pointer select-none">
            {selectedIds.size}/{employees.length}
          </label>
        </div>
      </div>

      {/* Lista */}
      <div
        className="overflow-y-auto max-h-[26vh] p-1 scrollbar-thin"
        role="list"
        aria-label="Lista de empleados"
      >
        {employees.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 px-3">
            Sin resultados para los filtros aplicados.
          </p>
        ) : (
          employees.map((emp) => (
            <EmployeeRow
              key={emp.dbId}
              employee={emp}
              selected={selectedIds.has(emp.dbId)}
              onToggle={onToggle}
              topic={topic}
            />
          ))
        )}
      </div>
    </div>
  )
})

// ─── MessagePreview ────────────────────────────────────────────────────────────

interface MessagePreviewProps {
  loading: boolean
  text: string
  htmlContent: string
  format: "whatsapp" | "email"
  employeeCount: number
  vencidasCount: number
}

const MessagePreview = memo(function MessagePreview({
  loading, text, htmlContent, format, employeeCount, vencidasCount,
}: MessagePreviewProps) {
  const chars = format === "whatsapp" ? text.length : htmlContent.length
  const isOverLimit = format === "whatsapp" && chars > WA_CHAR_LIMIT

  return (
    <section
      aria-label="Vista previa del mensaje"
      className="flex flex-col flex-1 min-h-0 rounded-lg border border-border/60 bg-card overflow-hidden"
    >
      {/* Header de la preview */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Vista previa
        </span>
        <div className="flex items-center gap-1.5">
          {format === "whatsapp" && (
            <Badge
              variant={isOverLimit ? "destructive" : "secondary"}
              className="text-[10px] font-mono h-5 gap-1"
              title={`Límite WhatsApp: ${WA_CHAR_LIMIT.toLocaleString("es-MX")} caracteres`}
            >
              {isOverLimit && <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />}
              <span>{chars.toLocaleString("es-MX")} / {WA_CHAR_LIMIT.toLocaleString("es-MX")}</span>
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] font-mono h-5 gap-1" aria-label={`${employeeCount} empleados`}>
            <Users className="h-2.5 w-2.5" aria-hidden="true" />
            {employeeCount}
          </Badge>
          {vencidasCount > 0 && (
            <Badge variant="destructive" className="text-[10px] font-mono h-5 gap-1" aria-label={`${vencidasCount} vencidas`}>
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
              {vencidasCount} vencida{vencidasCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div
        role="region"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Mensaje generado"
        className={cn(
          "flex-1 overflow-y-auto p-4 scrollbar-thin",
          "min-h-[160px] max-h-[clamp(160px,35vh,280px)]",
          format === "whatsapp"
            ? "whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground"
            : "text-sm text-foreground"
        )}
      >
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Cargando">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ) : format === "whatsapp" ? (
          text
        ) : (
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </section>
  )
})

// ─── Main Component ───────────────────────────────────────────────────────────

export interface IngresosWhatsappModalProps {
  open: boolean
  onClose: () => void
}

export function IngresosWhatsappModal({ open, onClose }: IngresosWhatsappModalProps) {
  const { loading, deptGroups } = usePendingEvals() as {
    loading: boolean
    deptGroups: DeptGroup[]
  }

  // ── Estado ────────────────────────────────────────────────────────────────
  const [filterDept, setFilterDept] = useState<string>("all")
  const [filterTurno, setFilterTurno] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [urgencySort, setUrgencySort] = useState(false)
  const [template, setTemplate] = useState<TemplateType>("formal")
  const [format, setFormat] = useState<"whatsapp" | "email">("whatsapp")
  const [topic, setTopic] = useState<"evals" | "rg">("evals")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const templateSelectId = useId()

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setFilterDept("all")
      setFilterTurno("all")
      setSearchQuery("")
      setUrgencySort(false)
      setTemplate("formal")
      setFormat("whatsapp")
      setTopic("evals")
      setCopied(false)
      setSelectionMode(false)
      setSelectedIds(new Set())
    }
  }, [open])

  // ── Opciones derivadas ────────────────────────────────────────────────────
  const departments = useMemo<string[]>(
    () => deptGroups.map((g) => g.departamento).sort(),
    [deptGroups]
  )

  const turnos = useMemo<string[]>(() => {
    const ts = new Set<string>()
    deptGroups.forEach((g) => g.items.forEach((emp) => { if (emp.turno) ts.add(emp.turno) }))
    return Array.from(ts).sort()
  }, [deptGroups])

  // ── Empleados filtrados ───────────────────────────────────────────────────
  const filteredEmployees = useMemo<Employee[]>(() => {
    const result: Employee[] = []
    const q = searchQuery.toLowerCase().trim()

    for (const group of deptGroups) {
      if (filterDept !== "all" && group.departamento !== filterDept) continue
      let matched = group.items.filter((emp) => {
        if (filterTurno !== "all" && emp.turno !== filterTurno) return false
        if (topic === "evals" && emp.evals.length === 0) return false
        if (topic === "rg" && emp.rg_rec_048 !== "Pendiente") return false
        return true
      })
      if (q) {
        matched = matched.filter(
          (emp) => emp.nombre.toLowerCase().includes(q) || emp.numero?.toString().includes(q)
        )
      }
      if (matched.length > 0) result.push(...matched)
    }

    if (urgencySort) {
      result.sort((a, b) => {
        const aV = topic === "evals" ? a.evals.some((e) => e.diasDiff < 0) : typeof a.rg_dias_diff === "number" && a.rg_dias_diff < 0
        const bV = topic === "evals" ? b.evals.some((e) => e.diasDiff < 0) : typeof b.rg_dias_diff === "number" && b.rg_dias_diff < 0
        return (aV === bV) ? 0 : aV ? -1 : 1
      })
    }

    return result
  }, [deptGroups, filterDept, filterTurno, searchQuery, urgencySort, topic])

  useEffect(() => {
    if (selectionMode) {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.dbId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode])

  const activeEmployees = useMemo(() => {
    if (!selectionMode) return filteredEmployees
    return filteredEmployees.filter((e) => selectedIds.has(e.dbId))
  }, [selectionMode, filteredEmployees, selectedIds])

  const vencidasCount = useMemo(
    () => countVencidas(activeEmployees, topic),
    [activeEmployees, topic]
  )

  // ── Mensajes ──────────────────────────────────────────────────────────────
  const summaryText = useMemo(
    () => buildWhatsAppMessage({ employees: activeEmployees, filterDept, filterTurno, template, topic }),
    [activeEmployees, filterDept, filterTurno, template, topic]
  )

  const summaryHtml = useMemo(
    () => buildEmailMessage({ employees: activeEmployees, filterDept, filterTurno, template, topic }),
    [activeEmployees, filterDept, filterTurno, template, topic]
  )

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      if (format === "email") {
        const blobHtml = new Blob([summaryHtml], { type: "text/html" })
        const plainFallback = summaryHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
        const blobText = new Blob([plainFallback], { type: "text/plain" })
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText }),
        ])
      } else {
        await navigator.clipboard.writeText(summaryText)
      }
      setCopied(true)
      notify.success("Copiado al portapapeles")
      setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS)
    } catch {
      notify.error("No se pudo copiar el texto")
    }
  }, [summaryText, summaryHtml, format])

  const handleWhatsApp = useCallback(() => {
    if (summaryText.length > WA_CHAR_LIMIT) {
      notify.error("El mensaje excede el límite de WhatsApp. Reduce la lista primero.")
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, "_blank", "noopener,noreferrer")
  }, [summaryText])

  const handleDownload = useCallback(() => {
    downloadAsTxt(summaryText, `evaluaciones-pendientes-${new Date().toISOString().slice(0, 10)}.txt`)
    notify.success("Archivo descargado")
  }, [summaryText])

  const handleToggleEmployee = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = filteredEmployees.map((e) => e.dbId)
      return allIds.every((id) => prev.has(id)) ? new Set() : new Set(allIds)
    })
  }, [filteredEmployees])

  const handleTopicChange = useCallback((value: string) => {
    setTopic(value as "evals" | "rg")
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      title="Compartir pendientes"
      description="Resumen de evaluaciones de nuevo ingreso"
      maxWidth="sm:max-w-2xl"
    >
      <ModalHeader
        title="Compartir pendientes"
        subtitle="Evaluaciones de nuevo ingreso"
        onClose={onClose}
      />

      <div className="flex flex-col gap-4 p-4 sm:p-5 min-h-0 flex-1">

        {/* ── Fila 1: Tipo de documento + Formato en una sola línea ─────── */}
        <div className="grid grid-cols-2 gap-2">
          <SegmentControl
            value={topic}
            onValueChange={handleTopicChange}
            options={[
              { value: "evals", label: "Evaluaciones" },
              { value: "rg", label: "RG-REC-048" },
            ]}
            ariaLabel="Tipo de documento"
          />
          <SegmentControl
            value={format}
            onValueChange={(v) => setFormat(v as "whatsapp" | "email")}
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Correo" },
            ]}
            ariaLabel="Formato de salida"
          />
        </div>

        {/* ── Fila 2: Plantilla ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Label htmlFor={templateSelectId} className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            Plantilla
          </Label>
          <Select value={template} onValueChange={(v) => setTemplate(v as TemplateType)}>
            <SelectTrigger id={templateSelectId} className="h-8 flex-1 bg-muted/50 border-border/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Fila 3: Filtros (colapsables en móvil) ───────────────────── */}
        <FilterBar
          filterDept={filterDept} setFilterDept={setFilterDept}
          filterTurno={filterTurno} setFilterTurno={setFilterTurno}
          urgencySort={urgencySort} setUrgencySort={setUrgencySort}
          departments={departments} turnos={turnos}
        />

        {/* ── Fila 4: Selección de empleados (toggle) ───────────────────── */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectionMode((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors rounded-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectionMode
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-expanded={selectionMode}
          >
            {selectionMode
              ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            }
            {selectionMode ? "Ocultar selección individual" : "Seleccionar empleados individualmente"}
            {!selectionMode && filteredEmployees.length > 0 && (
              <span className="text-muted-foreground/60">({filteredEmployees.length})</span>
            )}
          </button>

          {selectionMode && (
            <EmployeePanel
              employees={filteredEmployees}
              selectedIds={selectedIds}
              onToggle={handleToggleEmployee}
              onToggleAll={handleToggleAll}
              topic={topic}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
        </div>

        {/* Búsqueda rápida (cuando selección individual está cerrada) */}
        {!selectionMode && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Buscar empleado por nombre o número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={SEARCH_MAX_LENGTH}
              className="pl-8 h-8 bg-muted/40 border-border/50 text-sm placeholder:text-muted-foreground/60"
              aria-label="Buscar empleado"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* ── Fila 5: Vista previa ─────────────────────────────────────── */}
        <MessagePreview
          loading={loading}
          text={summaryText}
          htmlContent={summaryHtml}
          format={format}
          employeeCount={activeEmployees.length}
          vencidasCount={vencidasCount}
        />

        {/* ── Fila 6: Acción secundaria ─────────────────────────────────── */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={loading || activeEmployees.length === 0}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Descargar como .txt"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Descargar .txt
          </Button>
        </div>
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={format === "whatsapp" ? handleWhatsApp : handleCopy}
        saving={false}
        confirmIcon={
          format === "whatsapp"
            ? <MessageSquareShare className="h-4 w-4" aria-hidden="true" />
            : copied
              ? <Check className="h-4 w-4" aria-hidden="true" />
              : <Copy className="h-4 w-4" aria-hidden="true" />
        }
        confirmLabel={
          format === "whatsapp"
            ? "Enviar WhatsApp"
            : copied ? "¡Copiado!" : "Copiar texto"
        }
        confirmDisabled={loading || activeEmployees.length === 0}
        secondaryAction={
          format === "whatsapp"
            ? {
                label: copied ? "Copiado" : "Copiar",
                icon: copied
                  ? <Check className="h-4 w-4" aria-hidden="true" />
                  : <Copy className="h-4 w-4" aria-hidden="true" />,
                onClick: handleCopy,
                variant: "outline"
              }
            : undefined
        }
      />
    </ResponsiveShell>
  )
}
