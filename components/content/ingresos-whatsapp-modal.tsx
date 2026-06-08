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
  Send,
  Check,
  MessageSquareShare,
  Search,
  AlertCircle,
  Download,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  X,
} from "lucide-react"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { usePendingEvals } from "@/lib/hooks/usePendingEvals"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { notify } from "@/lib/notify"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// ─── Constants ───────────────────────────────────────────────────────────────

const MESES_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
] as const

type Mes = typeof MESES_ES[number]

const COPY_RESET_DELAY_MS = 2000
const WA_CHAR_LIMIT = 65_000
const SEARCH_MAX_LENGTH = 80

type TemplateType = "formal" | "informal" | "urgent"

// Sin emojis — la urgencia se comunica mediante el texto y la jerarquía visual
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
    footer: "_Por favor atender esto el dia de hoy sin falta._",
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvalItem {
  periodo: string
  fecha: string
  diasDiff: number
}

export interface Employee {
  dbId: string                        // clave estable para selection
  nombre: string
  numero?: string | number
  turno?: string
  departamento?: string
  evals: EvalItem[]
}

export interface DeptGroup {
  departamento: string
  items: Employee[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Devuelve "MES_ANTERIOR - MES_ACTUAL" en español a partir de una fecha ISO. */
function getPeriodoLabel(fechaIso: string): string {
  const month = Number(fechaIso.split("-")[1]) // 1-indexed
  const prevMonth = month === 1 ? 12 : month - 1
  return `${MESES_ES[prevMonth - 1]} - ${MESES_ES[month - 1]}`
}

/** Cuenta cuántas evaluaciones tienen diasDiff < 0 (vencidas) en una lista de empleados. */
function countVencidas(employees: Employee[]): number {
  return employees.reduce(
    (acc, emp) => acc + emp.evals.filter((e) => e.diasDiff < 0).length,
    0
  )
}

/** Descarga un string como archivo .txt */
function downloadAsTxt(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Eval status formatter ────────────────────────────────────────────────────

/**
 * Devuelve la etiqueta de estado de una evaluación.
 *
 * - diasDiff < 0  → "Vencida hace N día(s)"  (valor absoluto de diasDiff)
 * - diasDiff === 0 → "Vence hoy"
 * - diasDiff > 0  → "Pendiente (vence en N día(s))"
 */
function formatEvalStatus(diasDiff: number): string {
  if (diasDiff < 0) {
    const n = Math.abs(diasDiff)
    return `Vencida hace ${n} ${n === 1 ? "dia" : "dias"}`
  }
  if (diasDiff === 0) return "Vence hoy"
  return `Pendiente (vence en ${diasDiff} ${diasDiff === 1 ? "dia" : "dias"})`
}

// ─── Message Builder ──────────────────────────────────────────────────────────

interface BuildMessageOptions {
  employees: Employee[]
  filterDept: string
  filterTurno: string
  template: TemplateType
}

/**
 * Construye el mensaje de WhatsApp a partir de la lista de empleados filtrada.
 * Separado del componente para facilitar pruebas unitarias.
 */
function buildWhatsAppMessage({
  employees,
  filterDept,
  filterTurno,
  template,
}: BuildMessageOptions): string {
  if (employees.length === 0) {
    return "No hay evaluaciones pendientes para los filtros seleccionados."
  }

  const t = TEMPLATES[template]
  const lines: string[] = [t.title, ""]

  if (filterDept !== "all") lines.push(`*Departamento:* ${filterDept}`)
  if (filterTurno !== "all") lines.push(`*Turno:* ${filterTurno}`)
  if (filterDept !== "all" || filterTurno !== "all") lines.push("")

  // Agrupar por departamento
  const byDept = employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    const dept = emp.departamento ?? "Sin departamento"
    ;(acc[dept] ??= []).push(emp)
    return acc
  }, {})

  for (const [dept, emps] of Object.entries(byDept)) {
    if (filterDept === "all") {
      lines.push(`*${dept}*`)
    }

    for (const emp of emps) {
      const numStr = emp.numero ? ` (#${emp.numero})` : ""
      lines.push(`*${emp.nombre}*${numStr}`)

      for (const ev of emp.evals) {
        const periodLabel = getPeriodoLabel(ev.fecha)
        lines.push(`  - ${ev.periodo} (${periodLabel}): ${formatEvalStatus(ev.diasDiff)}`)
      }

      lines.push("")
    }
  }

  lines.push(t.footer)
  lines.push("_Capacitacion_")

  return lines.join("\n")
}

/**
 * Construye el mensaje de Correo a partir de la lista de empleados filtrada.
 * Retorna un string con formato HTML enriquecido.
 */
function buildEmailMessage({
  employees,
  filterDept,
  filterTurno,
  template,
}: BuildMessageOptions): string {
  if (employees.length === 0) {
    return "<p>No hay evaluaciones pendientes para los filtros seleccionados.</p>"
  }

  const t = TEMPLATES[template]
  const titleHtml = t.title.replace(/\*(.*?)\*/g, "<strong>$1</strong>")
  const footerHtml = t.footer.replace(/_(.*?)_/g, "<em>$1</em>")

  let html = `<div style="font-family: sans-serif; color: #333; line-height: 1.5;">`
  html += `<p style="font-size: 16px; margin-bottom: 16px;">${titleHtml}</p>`

  if (filterDept !== "all" || filterTurno !== "all") {
    html += `<p style="margin-bottom: 16px; font-size: 14px; color: #555;">`
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
      html += `<h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 15px; color: #111;">${dept}</h3>`
    }

    html += `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px;">`
    for (const emp of emps) {
      const numStr = emp.numero ? ` (#${emp.numero})` : ""
      html += `<li style="margin-bottom: 12px;">`
      html += `<strong style="font-size: 14px;">${emp.nombre}</strong><span style="color: #666; font-size: 13px;">${numStr}</span>`
      html += `<ul style="margin-top: 4px; margin-bottom: 0; padding-left: 20px; color: #444; font-size: 14px;">`
      for (const ev of emp.evals) {
        const periodLabel = getPeriodoLabel(ev.fecha)
        html += `<li style="margin-bottom: 2px;">${ev.periodo} (${periodLabel}): ${formatEvalStatus(ev.diasDiff)}</li>`
      }
      html += `</ul></li>`
    }
    html += `</ul>`
  }

  html += `<p style="margin-top: 20px; font-size: 14px;">${footerHtml}<br>`
  html += `<em>Capacitación</em></p>`
  html += `</div>`

  return html
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface FilterFieldProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  allLabel: string
  options: string[]
  renderOption?: (value: string) => string
}

const FilterField = memo(function FilterField({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  allLabel,
  options,
  renderOption,
}: FilterFieldProps) {
  return (
    <div className="flex-1 space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className="w-full bg-muted/50 border-border/50 text-sm"
          aria-label={`${label}: ${value === "all" ? allLabel : value}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-card">
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {renderOption ? renderOption(opt) : opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
})

// ─── Stats Bar ────────────────────────────────────────────────────────────────

interface StatsBarProps {
  employeeCount: number
  vencidasCount: number
  charCount: number
  isOverLimit: boolean
  format: "whatsapp" | "email"
}

const StatsBar = memo(function StatsBar({
  employeeCount,
  vencidasCount,
  charCount,
  isOverLimit,
  format,
}: StatsBarProps) {
  return (
    <div
      className="bg-muted px-3 py-2 border-b flex items-center justify-between flex-wrap gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        aria-hidden="true"
      >
        Vista Previa
      </span>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Contador de caracteres */}
        {format === "whatsapp" && (
          <Badge
            variant={isOverLimit ? "destructive" : "secondary"}
            className="text-[10px] font-mono flex items-center gap-1"
            title="Limite de caracteres de WhatsApp (~65,000)"
          >
            {isOverLimit && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
            {charCount.toLocaleString("es-MX")} / {WA_CHAR_LIMIT.toLocaleString("es-MX")}
          </Badge>
        )}

        {/* Empleados incluidos */}
        <Badge
          variant="secondary"
          className="text-[10px] font-mono flex items-center gap-1"
          aria-label={`${employeeCount} empleados incluidos`}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          {employeeCount}
        </Badge>

        {/* Vencidas — solo si hay */}
        {vencidasCount > 0 && (
          <Badge
            variant="destructive"
            className="text-[10px] font-mono flex items-center gap-1"
            aria-label={`${vencidasCount} evaluaciones vencidas`}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            {vencidasCount} vencida{vencidasCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  )
})

// ─── Employee Row (para el modo selección) ────────────────────────────────────

interface EmployeeRowProps {
  employee: Employee
  selected: boolean
  onToggle: (id: string) => void
}

const EmployeeRow = memo(function EmployeeRow({
  employee,
  selected,
  onToggle,
}: EmployeeRowProps) {
  const hasVencida = employee.evals.some((e) => e.diasDiff < 0)

  return (
    <label
      className={cn(
        "flex items-start gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
        "hover:bg-muted/60",
        selected && "bg-muted/40"
      )}
    >
      <Checkbox
        id={`emp-${employee.dbId}`}
        checked={selected}
        onCheckedChange={() => onToggle(employee.dbId)}
        className="mt-0.5"
        aria-label={`Incluir a ${employee.nombre}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {employee.nombre}
          {employee.numero && (
            <span className="text-muted-foreground font-normal ml-1">
              #{employee.numero}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[employee.departamento, employee.turno ? `Turno ${employee.turno}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {hasVencida && (
        <Badge variant="destructive" className="text-[10px] shrink-0">
          Vencida
        </Badge>
      )}
    </label>
  )
})

// ─── Employee Selection Panel ─────────────────────────────────────────────────

interface EmployeeSelectionPanelProps {
  employees: Employee[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
}

const EmployeeSelectionPanel = memo(function EmployeeSelectionPanel({
  employees,
  selectedIds,
  onToggle,
  onToggleAll,
}: EmployeeSelectionPanelProps) {
  const allSelected = employees.every((e) => selectedIds.has(e.dbId))
  const someSelected = employees.some((e) => selectedIds.has(e.dbId))

  return (
    <section aria-label="Seleccion de empleados" className="space-y-1">
      {/* Header con toggle-all */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) el.dataset.indeterminate = String(!allSelected && someSelected)
            }}
            onCheckedChange={onToggleAll}
            aria-label="Seleccionar todos los empleados"
          />
          <span className="text-xs font-medium text-muted-foreground">
            {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
          </span>
        </label>
        <span className="text-xs text-muted-foreground">
          {selectedIds.size} / {employees.length}
        </span>
      </div>

      <div
        className="overflow-y-auto max-h-[28vh] space-y-0.5 scrollbar-thin"
        role="list"
      >
        {employees.map((emp) => (
          <EmployeeRow
            key={emp.dbId}
            employee={emp}
            selected={selectedIds.has(emp.dbId)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  )
})

// ─── Preview Area ─────────────────────────────────────────────────────────────

interface PreviewAreaProps {
  loading: boolean
  text: string
  htmlContent?: string
  format: "whatsapp" | "email"
  employeeCount: number
  vencidasCount: number
}

const PreviewArea = memo(function PreviewArea({
  loading,
  text,
  htmlContent,
  format,
  employeeCount,
  vencidasCount,
}: PreviewAreaProps) {
  const chars = format === "whatsapp" ? text.length : (htmlContent || "").length
  const isOverLimit = format === "whatsapp" && chars > WA_CHAR_LIMIT

  return (
    <section
      aria-label="Vista previa del mensaje"
      className="flex flex-col flex-1 min-h-0 border rounded-lg bg-muted/30 overflow-hidden"
    >
      <StatsBar
        employeeCount={employeeCount}
        vencidasCount={vencidasCount}
        charCount={chars}
        isOverLimit={isOverLimit}
        format={format}
      />

      <div
        role="region"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Contenido del mensaje generado"
        className={cn(
          "p-4 overflow-y-auto scrollbar-thin max-h-[clamp(35vh,40vh,300px)]",
          format === "whatsapp" 
            ? "whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground" 
            : "bg-background rounded-b-md border-t"
        )}
      >
        {loading ? (
          <div className="space-y-2" aria-label="Cargando evaluaciones" role="status">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : format === "whatsapp" ? (
          text
        ) : (
          <div dangerouslySetInnerHTML={{ __html: htmlContent || "" }} />
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

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filterDept, setFilterDept] = useState<string>("all")
  const [filterTurno, setFilterTurno] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [urgencySort, setUrgencySort] = useState(false)
  const [template, setTemplate] = useState<TemplateType>("formal")
  const [format, setFormat] = useState<"whatsapp" | "email">("whatsapp")

  // ── Feature: Modo selección individual ─────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── UI state ───────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)

  // IDs accesibles
  const deptSelectId = useId()
  const turnoSelectId = useId()
  const templateSelectId = useId()

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      setFilterDept("all")
      setFilterTurno("all")
      setSearchQuery("")
      setUrgencySort(false)
      setTemplate("formal")
      setFormat("whatsapp")
      setCopied(false)
      setSelectionMode(false)
      setSelectedIds(new Set())
    }
  }, [open])

  // ── Opciones de filtro derivadas de los datos ─────────────────────────────
  const departments = useMemo<string[]>(
    () => deptGroups.map((g) => g.departamento).sort(),
    [deptGroups]
  )

  const turnos = useMemo<string[]>(() => {
    const ts = new Set<string>()
    deptGroups.forEach((g) =>
      g.items.forEach((emp) => {
        if (emp.turno) ts.add(emp.turno)
      })
    )
    return Array.from(ts).sort()
  }, [deptGroups])

  // ── Empleados filtrados por dept/turno/búsqueda ───────────────────────────
  const filteredEmployees = useMemo<Employee[]>(() => {
    const result: Employee[] = []
    const q = searchQuery.toLowerCase().trim()

    for (const group of deptGroups) {
      if (filterDept !== "all" && group.departamento !== filterDept) continue

      let matched = group.items.filter(
        (emp) => filterTurno === "all" || emp.turno === filterTurno
      )

      if (q) {
        matched = matched.filter(
          (emp) =>
            emp.nombre.toLowerCase().includes(q) ||
            emp.numero?.toString().includes(q)
        )
      }

      if (matched.length > 0) result.push(...matched)
    }

    if (urgencySort) {
      result.sort((a, b) => {
        const aVencida = a.evals.some((e) => e.diasDiff < 0)
        const bVencida = b.evals.some((e) => e.diasDiff < 0)
        if (aVencida && !bVencida) return -1
        if (!aVencida && bVencida) return 1
        return 0
      })
    }

    return result
  }, [deptGroups, filterDept, filterTurno, searchQuery, urgencySort])

  // Sincronizar selectedIds cuando cambia filteredEmployees:
  // al activar el modo selección pre-seleccionamos todos los visibles
  useEffect(() => {
    if (selectionMode) {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.dbId)))
    }
  }, [selectionMode, filteredEmployees])

  // ── Empleados finales (respeta selección manual si el modo está activo) ────
  const activeEmployees = useMemo(() => {
    if (!selectionMode) return filteredEmployees
    return filteredEmployees.filter((e) => selectedIds.has(e.dbId))
  }, [selectionMode, filteredEmployees, selectedIds])

  const vencidasCount = useMemo(
    () => countVencidas(activeEmployees),
    [activeEmployees]
  )

  // ── Texto generado ────────────────────────────────────────────────────────
  const summaryText = useMemo(
    () =>
      buildWhatsAppMessage({
        employees: activeEmployees,
        filterDept,
        filterTurno,
        template,
      }),
    [activeEmployees, filterDept, filterTurno, template]
  )

  const summaryHtml = useMemo(
    () =>
      buildEmailMessage({
        employees: activeEmployees,
        filterDept,
        filterTurno,
        template,
      }),
    [activeEmployees, filterDept, filterTurno, template]
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      if (format === "email") {
        const blobHtml = new Blob([summaryHtml], { type: "text/html" })
        const plainFallback = summaryHtml
          .replace(/<br\s*[\/]?>/gi, "\n")
          .replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\n\s*\n/g, "\n\n")
          .trim()
        
        const blobText = new Blob([plainFallback], { type: "text/plain" })
        const item = new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        })
        await navigator.clipboard.write([item])
      } else {
        await navigator.clipboard.writeText(summaryText)
      }

      setCopied(true)
      notify.success("Texto copiado al portapapeles")
      const timer = setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS)
      // El cleanup aquí no es necesario para useCallback; el timer es corto y seguro.
      return () => clearTimeout(timer)
    } catch {
      notify.error("No se pudo copiar el texto")
    }
  }, [summaryText, summaryHtml, format])

  const handleWhatsApp = useCallback(() => {
    if (summaryText.length > WA_CHAR_LIMIT) {
      notify.error(
        "El mensaje excede el limite de WhatsApp. Filtra o reduce la lista primero."
      )
      return
    }
    const encoded = encodeURIComponent(summaryText)
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer")
  }, [summaryText])

  // Feature: descarga como .txt
  const handleDownload = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10)
    downloadAsTxt(summaryText, `evaluaciones-pendientes-${date}.txt`)
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
      const allSelected = allIds.every((id) => prev.has(id))
      return allSelected ? new Set() : new Set(allIds)
    })
  }, [filteredEmployees])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      title="Compartir Pendientes"
      description="Resumen de evaluaciones de nuevo ingreso para compartir por WhatsApp"
      maxWidth="sm:max-w-2xl"
    >
      <ModalToolbar
        title="Compartir Pendientes"
        subtitle="Resumen de evaluaciones de nuevo ingreso"
        saving={false}
        onClose={onClose}
        secondaryAction={format === "whatsapp" ? {
          label: copied ? "Copiado" : "Copiar",
          icon: copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          ),
          onClick: handleCopy,
          variant: "outline",
          iconOnly: true,
        } : undefined}
        onConfirm={format === "whatsapp" ? handleWhatsApp : handleCopy}
        confirmIcon={
          format === "whatsapp" ? (
            <MessageSquareShare className="h-4 w-4" aria-hidden="true" />
          ) : copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )
        }
      />

      <div className="p-4 sm:p-6 space-y-5 flex flex-col min-h-0 flex-1">
        
        <Tabs value={format} onValueChange={(v) => setFormat(v as "whatsapp" | "email")} className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="email">Correo Electrónico</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Busqueda y Plantilla ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="search-emp"
              className="text-xs font-medium text-muted-foreground"
            >
              Buscar empleado
            </Label>
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="search-emp"
                placeholder="Nombre o numero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={SEARCH_MAX_LENGTH}
                className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpiar busqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor={templateSelectId}
              className="text-xs font-medium text-muted-foreground"
            >
              Plantilla
            </Label>
            <Select
              value={template}
              onValueChange={(v) => setTemplate(v as TemplateType)}
            >
              <SelectTrigger
                id={templateSelectId}
                className="h-9 w-full bg-muted/50 border-border/50 text-sm"
              >
                <SelectValue placeholder="Selecciona plantilla" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="informal">Informal</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Filtros y Orden ───────────────────────────────────────────────── */}
        <fieldset className="flex flex-col sm:flex-row items-end gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
          <legend className="sr-only">Filtros y ordenamiento</legend>

          <FilterField
            id={deptSelectId}
            label="Departamento"
            value={filterDept}
            onValueChange={setFilterDept}
            placeholder="Todos"
            allLabel="Todos los departamentos"
            options={departments}
          />

          <FilterField
            id={turnoSelectId}
            label="Turno"
            value={filterTurno}
            onValueChange={setFilterTurno}
            placeholder="Todos"
            allLabel="Todos los turnos"
            options={turnos}
            renderOption={(t) => `Turno ${t}`}
          />

          <div className="flex items-center gap-2 h-9">
            <Switch
              id="urgency-sort"
              checked={urgencySort}
              onCheckedChange={setUrgencySort}
            />
            <Label
              htmlFor="urgency-sort"
              className="text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              Priorizar vencidas
            </Label>
          </div>
        </fieldset>

        {/* ── Feature: Seleccion individual ─────────────────────────────────── */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectionMode((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={selectionMode}
            aria-controls="selection-panel"
          >
            {selectionMode ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {selectionMode ? "Ocultar seleccion" : "Seleccionar empleados individualmente"}
          </button>

          {selectionMode && (
            <div
              id="selection-panel"
              className="border border-border/50 rounded-lg bg-muted/20 p-2"
            >
              {filteredEmployees.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No hay empleados para los filtros aplicados.
                </p>
              ) : (
                <EmployeeSelectionPanel
                  employees={filteredEmployees}
                  selectedIds={selectedIds}
                  onToggle={handleToggleEmployee}
                  onToggleAll={handleToggleAll}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Vista previa ──────────────────────────────────────────────────── */}
        <PreviewArea
          loading={loading}
          text={summaryText}
          htmlContent={summaryHtml}
          format={format}
          employeeCount={activeEmployees.length}
          vencidasCount={vencidasCount}
        />

        {/* ── Acciones secundarias ──────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={loading || activeEmployees.length === 0}
            className="text-xs gap-1.5"
            aria-label="Descargar mensaje como archivo de texto"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Descargar .txt
          </Button>
        </div>
      </div>
    </ResponsiveShell>
  )
}
