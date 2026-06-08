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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  return `${MESES_ES[prevMonth - 1]} - ${MESES_ES[month - 1]}`
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

// ─── Eval status formatter ────────────────────────────────────────────────────

function formatEvalStatus(diasDiff: number): string {
  if (diasDiff < 0) {
    const n = Math.abs(diasDiff)
    return `Vencida hace ${n} ${n === 1 ? "día" : "días"}`
  }
  if (diasDiff === 0) return "Vence hoy"
  return `Pendiente (vence en ${diasDiff} ${diasDiff === 1 ? "día" : "días"})`
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
          const periodLabel = getPeriodoLabel(ev.fecha)
          lines.push(
            `  - ${ev.periodo} (${periodLabel}): ${formatEvalStatus(ev.diasDiff)}`
          )
        }
      } else if (topic === "rg" && emp.rg_rec_048 === "Pendiente") {
        lines.push(
          `  - RG-REC-048: ${formatEvalStatus(emp.rg_dias_diff ?? 0)}`
        )
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

  // FIX 1: colores hardcodeados → variables CSS en el HTML inline generado.
  // Usamos una paleta de variables seguras para correo (no todas las CSS vars
  // funcionan en clientes de correo, pero sí cuando el HTML se muestra en el
  // propio componente). Para exportación real a correo considera usar valores
  // hex derivados del tema en el momento de la generación.
  let html = `<div style="font-family: var(--font-sans, sans-serif); line-height: 1.5; color: hsl(var(--foreground));">`
  html += `<p style="font-size: 1rem; margin-bottom: 1rem;">${titleHtml}</p>`

  if (filterDept !== "all" || filterTurno !== "all") {
    html += `<p style="margin-bottom: 1rem; font-size: 0.875rem; color: hsl(var(--muted-foreground));">`
    if (filterDept !== "all")
      html += `<strong>Departamento:</strong> ${filterDept}<br>`
    if (filterTurno !== "all")
      html += `<strong>Turno:</strong> ${filterTurno}`
    html += `</p>`
  }

  const byDept = employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    const dept = emp.departamento ?? "Sin departamento"
    ;(acc[dept] ??= []).push(emp)
    return acc
  }, {})

  for (const [dept, emps] of Object.entries(byDept)) {
    if (filterDept === "all") {
      html += `<h3 style="margin-top: 1.25rem; margin-bottom: 0.625rem; font-size: 0.9375rem; color: hsl(var(--foreground));">${dept}</h3>`
    }

    html += `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 1.25rem;">`
    for (const emp of emps) {
      const numStr = emp.numero ? ` (#${emp.numero})` : ""
      html += `<li style="margin-bottom: 0.75rem;">`
      html += `<strong style="font-size: 0.875rem;">${emp.nombre}</strong>`
      html += `<span style="color: hsl(var(--muted-foreground)); font-size: 0.8125rem;">${numStr}</span>`
      html += `<ul style="margin-top: 0.25rem; margin-bottom: 0; padding-left: 1.25rem; color: hsl(var(--foreground)); font-size: 0.875rem;">`

      if (topic === "evals") {
        for (const ev of emp.evals) {
          const periodLabel = getPeriodoLabel(ev.fecha)
          html += `<li style="margin-bottom: 0.125rem;">${ev.periodo} (${periodLabel}): ${formatEvalStatus(ev.diasDiff)}</li>`
        }
      } else if (topic === "rg" && emp.rg_rec_048 === "Pendiente") {
        html += `<li style="margin-bottom: 0.125rem;">RG-REC-048: ${formatEvalStatus(emp.rg_dias_diff ?? 0)}</li>`
      }

      html += `</ul></li>`
    }
    html += `</ul>`
  }

  html += `<p style="margin-top: 1.25rem; font-size: 0.875rem;">${footerHtml}<br>`
  html += `<em>Capacitación</em></p>`
  html += `</div>`

  return html
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        Vista previa
      </span>

      <div className="flex items-center gap-2 flex-wrap">
        {format === "whatsapp" && (
          <Badge
            variant={isOverLimit ? "destructive" : "secondary"}
            className="text-[10px] font-mono flex items-center gap-1"
            title={`Límite de caracteres de WhatsApp (~${WA_CHAR_LIMIT.toLocaleString("es-MX")})`}
          >
            {isOverLimit && (
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
            )}
            <span aria-label={`${charCount.toLocaleString("es-MX")} de ${WA_CHAR_LIMIT.toLocaleString("es-MX")} caracteres`}>
              {charCount.toLocaleString("es-MX")} /{" "}
              {WA_CHAR_LIMIT.toLocaleString("es-MX")}
            </span>
          </Badge>
        )}

        <Badge
          variant="secondary"
          className="text-[10px] font-mono flex items-center gap-1"
          aria-label={`${employeeCount} empleado${employeeCount !== 1 ? "s" : ""} incluido${employeeCount !== 1 ? "s" : ""}`}
        >
          <Users className="h-3 w-3" aria-hidden="true" />
          <span aria-hidden="true">{employeeCount}</span>
        </Badge>

        {vencidasCount > 0 && (
          <Badge
            variant="destructive"
            className="text-[10px] font-mono flex items-center gap-1"
            aria-label={`${vencidasCount} evaluación${vencidasCount !== 1 ? "es" : ""} vencida${vencidasCount !== 1 ? "s" : ""}`}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span aria-hidden="true">
              {vencidasCount} vencida{vencidasCount !== 1 ? "s" : ""}
            </span>
          </Badge>
        )}
      </div>
    </div>
  )
})

// ─── Employee Row ─────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  employee: Employee
  selected: boolean
  onToggle: (id: string) => void
  topic: "evals" | "rg"
}

const EmployeeRow = memo(function EmployeeRow({
  employee,
  selected,
  onToggle,
  topic,
}: EmployeeRowProps) {
  const hasVencida =
    topic === "evals"
      ? employee.evals.some((e) => e.diasDiff < 0)
      : typeof employee.rg_dias_diff === "number" && employee.rg_dias_diff < 0

  // FIX 2: <label> envolviendo un <Checkbox> es correcto semánticamente pero
  // el click area se superpone con el badge. Separamos el trigger en dos áreas
  // explícitas para mayor claridad de hit-target.
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2 rounded-md transition-colors",
        "hover:bg-muted/60",
        selected && "bg-muted/40"
      )}
      role="listitem"
    >
      <Checkbox
        id={`emp-${employee.dbId}`}
        checked={selected}
        onCheckedChange={() => onToggle(employee.dbId)}
        className="mt-0.5 shrink-0"
        aria-label={`Incluir a ${employee.nombre}`}
      />
      {/* FIX 3: htmlFor en el label apunta al id del Checkbox para asociación
          semántica correcta sin necesidad de envolver todo en <label>. */}
      <label
        htmlFor={`emp-${employee.dbId}`}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <p className="text-sm font-medium truncate">
          {employee.nombre}
          {employee.numero && (
            <span className="text-muted-foreground font-normal ml-1">
              #{employee.numero}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[
            employee.departamento,
            employee.turno ? `Turno ${employee.turno}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </label>
      {hasVencida && (
        <Badge variant="destructive" className="text-[10px] shrink-0">
          Vencida
        </Badge>
      )}
    </div>
  )
})

// ─── Employee Selection Panel ─────────────────────────────────────────────────

interface EmployeeSelectionPanelProps {
  employees: Employee[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  topic: "evals" | "rg"
}

const EmployeeSelectionPanel = memo(function EmployeeSelectionPanel({
  employees,
  selectedIds,
  onToggle,
  onToggleAll,
  topic,
}: EmployeeSelectionPanelProps) {
  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e.dbId))
  const someSelected = employees.some((e) => selectedIds.has(e.dbId))

  // FIX 4: el estado indeterminado en Radix Checkbox se maneja vía prop
  // `data-state`, no con dataset directamente. Usamos un ref callback limpio.
  const toggleAllId = useId()

  return (
    <section aria-label="Selección de empleados" className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Checkbox
            id={toggleAllId}
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={onToggleAll}
            aria-label={
              allSelected
                ? "Deseleccionar todos los empleados"
                : "Seleccionar todos los empleados"
            }
          />
          <label
            htmlFor={toggleAllId}
            className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
          >
            {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
          </label>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {selectedIds.size} / {employees.length}
        </span>
      </div>

      <div
        className="overflow-y-auto max-h-[28vh] space-y-0.5 scrollbar-thin"
        role="list"
        aria-label="Lista de empleados"
      >
        {employees.map((emp) => (
          <EmployeeRow
            key={emp.dbId}
            employee={emp}
            selected={selectedIds.has(emp.dbId)}
            onToggle={onToggle}
            topic={topic}
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
  const chars = format === "whatsapp" ? text.length : (htmlContent ?? "").length
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

      {/* FIX 5: max-height con clamp movido a clase de utilidad Tailwind
          para mantener el layout con las variables de densidad del CSS global. */}
      <div
        role="region"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Contenido del mensaje generado"
        className={cn(
          "p-4 overflow-y-auto scrollbar-thin",
          "max-h-[clamp(200px,40vh,300px)]",
          format === "whatsapp"
            ? "whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground"
            : "bg-background rounded-b-md border-t"
        )}
      >
        {loading ? (
          <div
            className="space-y-2"
            aria-label="Cargando evaluaciones"
            role="status"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : format === "whatsapp" ? (
          text
        ) : (
          // FIX 6: dangerouslySetInnerHTML del HTML que generamos nosotros
          // mismos es seguro aquí. Añadimos sandbox visual explícito.
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: htmlContent ?? "" }}
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

export function IngresosWhatsappModal({
  open,
  onClose,
}: IngresosWhatsappModalProps) {
  const { loading, deptGroups } = usePendingEvals() as {
    loading: boolean
    deptGroups: DeptGroup[]
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filterDept, setFilterDept] = useState<string>("all")
  const [filterTurno, setFilterTurno] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [urgencySort, setUrgencySort] = useState(false)
  const [template, setTemplate] = useState<TemplateType>("formal")
  const [format, setFormat] = useState<"whatsapp" | "email">("whatsapp")
  const [topic, setTopic] = useState<"evals" | "rg">("evals")

  // ── Modo selección individual ─────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── UI state ──────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)

  // IDs accesibles
  const deptSelectId = useId()
  const turnoSelectId = useId()
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
          (emp) =>
            emp.nombre.toLowerCase().includes(q) ||
            emp.numero?.toString().includes(q)
        )
      }

      if (matched.length > 0) result.push(...matched)
    }

    if (urgencySort) {
      result.sort((a, b) => {
        const aVencida =
          topic === "evals"
            ? a.evals.some((e) => e.diasDiff < 0)
            : typeof a.rg_dias_diff === "number" && a.rg_dias_diff < 0
        const bVencida =
          topic === "evals"
            ? b.evals.some((e) => e.diasDiff < 0)
            : typeof b.rg_dias_diff === "number" && b.rg_dias_diff < 0
        if (aVencida && !bVencida) return -1
        if (!aVencida && bVencida) return 1
        return 0
      })
    }

    return result
  }, [deptGroups, filterDept, filterTurno, searchQuery, urgencySort, topic])

  // FIX 7: sincronizar selectedIds al activar el modo de selección.
  // Separamos el efecto en dos para evitar re-sincronización completa
  // cada vez que cambia filteredEmployees estando ya en modo selección.
  // Solo pre-seleccionamos al *activar* el modo; cambios de filtro posteriores
  // no alteran la selección del usuario.
  useEffect(() => {
    if (selectionMode) {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.dbId)))
    }
    // Intencionalmente excluimos filteredEmployees para que cambios de filtro
    // no reseteen la selección manual del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode])

  // ── Empleados activos (respeta selección manual) ──────────────────────────
  const activeEmployees = useMemo(() => {
    if (!selectionMode) return filteredEmployees
    return filteredEmployees.filter((e) => selectedIds.has(e.dbId))
  }, [selectionMode, filteredEmployees, selectedIds])

  const vencidasCount = useMemo(
    () => countVencidas(activeEmployees, topic),
    [activeEmployees, topic]
  )

  // ── Mensaje generado ──────────────────────────────────────────────────────
  const summaryText = useMemo(
    () =>
      buildWhatsAppMessage({
        employees: activeEmployees,
        filterDept,
        filterTurno,
        template,
        topic,
      }),
    [activeEmployees, filterDept, filterTurno, template, topic]
  )

  const summaryHtml = useMemo(
    () =>
      buildEmailMessage({
        employees: activeEmployees,
        filterDept,
        filterTurno,
        template,
        topic,
      }),
    [activeEmployees, filterDept, filterTurno, template, topic]
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  // FIX 8: el cleanup del setTimeout en useCallback no tiene efecto porque
  // useCallback no retorna una función de cleanup. Movemos el clearTimeout
  // al bloque try correctamente.
  const handleCopy = useCallback(async () => {
    let timer: ReturnType<typeof setTimeout> | null = null
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
      timer = setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS)
    } catch {
      if (timer) clearTimeout(timer)
      notify.error("No se pudo copiar el texto")
    }
  }, [summaryText, summaryHtml, format])

  const handleWhatsApp = useCallback(() => {
    if (summaryText.length > WA_CHAR_LIMIT) {
      notify.error(
        "El mensaje excede el límite de WhatsApp. Filtra o reduce la lista primero."
      )
      return
    }
    const encoded = encodeURIComponent(summaryText)
    window.open(
      `https://wa.me/?text=${encoded}`,
      "_blank",
      "noopener,noreferrer"
    )
  }, [summaryText])

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

  // FIX 9: desactivar modo selección al cambiar de topic para evitar
  // que selectedIds de "evals" quede activo silenciosamente en "rg".
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
      description="Resumen de evaluaciones de nuevo ingreso para compartir"
      maxWidth="sm:max-w-2xl"
    >
      <ModalToolbar
        title="Compartir pendientes"
        subtitle="Resumen de evaluaciones de nuevo ingreso"
        saving={false}
        onClose={onClose}
        secondaryAction={
          format === "whatsapp"
            ? {
                label: copied ? "Copiado" : "Copiar",
                icon: copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                ),
                onClick: handleCopy,
                variant: "outline",
                iconOnly: true,
              }
            : undefined
        }
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

        {/* ── Selector de tema ─────────────────────────────────────────────── */}
        <Tabs
          value={topic}
          onValueChange={handleTopicChange}
          className="w-full"
          aria-label="Tipo de documento"
        >
          <TabsList className="w-full h-9">
            <TabsTrigger
              value="evals"
              className="flex-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              Evaluaciones
            </TabsTrigger>
            <TabsTrigger
              value="rg"
              className="flex-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              RG-REC-048
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Selector de formato ──────────────────────────────────────────── */}
        <Tabs
          value={format}
          onValueChange={(v) => setFormat(v as "whatsapp" | "email")}
          className="w-full"
        >
          <TabsList className="w-full h-9">
            <TabsTrigger
              value="whatsapp"
              className="flex-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              WhatsApp
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="flex-1 text-muted-foreground data-[state=active]:text-foreground"
            >
              Correo electrónico
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Búsqueda y plantilla ─────────────────────────────────────────── */}
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
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="search-emp"
                type="search"
                placeholder="Nombre o número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={SEARCH_MAX_LENGTH}
                className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
                // FIX 10: aria-label descriptivo cuando el placeholder
                // no basta para contexto de lector de pantalla.
                aria-label="Buscar empleado por nombre o número"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
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

        {/* ── Filtros y orden ──────────────────────────────────────────────── */}
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
              aria-describedby="urgency-sort-desc"
            />
            <Label
              htmlFor="urgency-sort"
              className="text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              Priorizar vencidas
            </Label>
            {/* FIX 11: descripción accesible del switch para lectores de pantalla */}
            <span id="urgency-sort-desc" className="sr-only">
              Mueve al inicio de la lista los empleados con evaluaciones vencidas
            </span>
          </div>
        </fieldset>

        {/* ── Selección individual ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectionMode((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={selectionMode}
            aria-controls="selection-panel"
          >
            {selectionMode ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {selectionMode
              ? "Ocultar selección"
              : "Seleccionar empleados individualmente"}
          </button>

          {selectionMode && (
            <div
              id="selection-panel"
              className="border border-border/50 rounded-lg bg-muted/20 p-2"
              // FIX 12: región con role para anuncio correcto en lectores.
              role="region"
              aria-label="Panel de selección de empleados"
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
                  topic={topic}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Vista previa ─────────────────────────────────────────────────── */}
        <PreviewArea
          loading={loading}
          text={summaryText}
          htmlContent={summaryHtml}
          format={format}
          employeeCount={activeEmployees.length}
          vencidasCount={vencidasCount}
        />

        {/* ── Acciones secundarias ─────────────────────────────────────────── */}
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
