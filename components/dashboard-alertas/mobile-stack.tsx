"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Pencil,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  dias,
  formatDate,
  type EvalItem,
  type FechaItem,
} from "@/lib/hooks/useDashboardAlertas"
import { iniciales } from "./utils"
import {
  DetalleStat,
  MasterListItem,
  type MasterHeaderProps,
} from "./shared"

// ─── Mobile toolbar (sticky top): search + depto filter ──────────────────────

function MobileToolbar({
  total, filtrados, search, onSearchChange, depto, onDeptoChange, deptos,
}: MasterHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-card/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="relative">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar nombre o depto…"
          inputMode="search"
          className="h-11 pl-9 text-sm"
          aria-label="Buscar en alertas"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Select
          value={depto || "__all__"}
          onValueChange={(v) => onDeptoChange(v === "__all__" ? "" : v)}
        >
          <SelectTrigger
            aria-label="Filtrar por departamento"
            className="h-10 max-w-[60%] flex-1 truncate rounded-md px-2 text-sm"
          >
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los departamentos</SelectItem>
            {deptos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span
          aria-live="polite"
          className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
        >
          {filtrados}{filtrados !== total ? ` / ${total}` : ""}
        </span>
      </div>
    </div>
  )
}

function MobileDetailHeader({
  nombre, badgeLabel, badgeClass, onBack,
}: { nombre: string; badgeLabel: string; badgeClass: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Volver a la lista"
        className="h-10 w-10"
      >
        <ChevronLeft size={20} aria-hidden />
      </Button>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{nombre}</p>
      <Badge className={`shrink-0 ${badgeClass}`} variant="secondary">{badgeLabel}</Badge>
    </div>
  )
}

// ─── Mobile stack: Evaluaciones ──────────────────────────────────────────────

export function MobileStackEvals({
  items, vencida, onCalificar,
}: {
  items: EvalItem[]
  vencida: boolean
  onCalificar: (dbId: string, calificacion: number) => Promise<void>
}) {
  const tone: "destructive" | "warning" = vencida ? "destructive" : "warning"
  const badgeLabel = vencida ? "Vencida" : "Por vencer"
  const badgeClass = vencida
    ? "bg-destructive/10 text-destructive"
    : "bg-warning/10 text-warning"
  const toneText = vencida ? "text-destructive" : "text-warning"

  const [search, setSearch] = useState("")
  const [depto, setDepto]   = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [calStr, setCalStr] = useState("")
  const [saving, setSaving] = useState(false)

  const deptos = useMemo(
    () => Array.from(new Set(items.map(i => i.departamento?.trim() || "Sin departamento"))).sort(),
    [items],
  )

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i => {
      const dep = i.departamento?.trim() || "Sin departamento"
      if (depto && dep !== depto) return false
      if (!q) return true
      return i.nombre.toLowerCase().includes(q) || dep.toLowerCase().includes(q)
    })
  }, [items, search, depto])

  const seleccionado = useMemo(
    () => items.find(i => i.id === selectedId) ?? null,
    [items, selectedId],
  )

  function back() { setSelectedId(null); setCalStr("") }

  async function guardar() {
    if (!seleccionado) return
    const cal = parseInt(calStr, 10)
    if (isNaN(cal) || cal < 0 || cal > 100) return
    setSaving(true)
    try {
      await onCalificar(seleccionado.dbId, cal)
      setCalStr("")
      const idx = filtrados.findIndex(i => i.id === seleccionado.id)
      const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
      setSelectedId(next?.id ?? null)
    } finally {
      setSaving(false)
    }
  }

  if (seleccionado) {
    return (
      <div className="flex h-full flex-col">
        <MobileDetailHeader
          nombre={seleccionado.nombre}
          badgeLabel={badgeLabel}
          badgeClass={badgeClass}
          onBack={back}
        />
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold ${badgeClass}`}
            >
              {iniciales(seleccionado.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">{seleccionado.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[seleccionado.departamento, seleccionado.turno && `Turno ${seleccionado.turno}`]
                  .filter(Boolean).join(" · ") || "Sin departamento"}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <DetalleStat label="Fecha" value={formatDate(seleccionado.fecha)} icon={<Calendar size={12} aria-hidden />} />
            <DetalleStat label="Antigüedad" value={dias(seleccionado.diasDiff)} icon={<Clock size={12} aria-hidden />} valueClass={toneText} />
          </dl>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Pencil size={14} aria-hidden /> Calificación
            </h4>
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={100}
              value={calStr}
              onChange={(e) => setCalStr(e.target.value)}
              placeholder="0 – 100"
              className="h-11 text-base"
              aria-label="Calificación"
              autoFocus
            />
          </div>
        </div>

        <div
          className="sticky bottom-0 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            onClick={guardar}
            disabled={saving || calStr === ""}
            className="h-12 w-full text-base"
          >
            {saving ? "Guardando…" : "Guardar calificación"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <MobileToolbar
        total={items.length}
        filtrados={filtrados.length}
        search={search}
        onSearchChange={setSearch}
        depto={depto}
        onDeptoChange={setDepto}
        deptos={deptos}
      />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin resultados con los filtros actuales.
          </p>
        ) : (
          filtrados.map(i => (
            <MasterListItem
              key={i.id}
              nombre={i.nombre}
              meta={[i.departamento, i.turno ? `Turno ${i.turno}` : null].filter(Boolean).join(" · ") || "Sin departamento"}
              diasLabel={dias(i.diasDiff)}
              fechaLabel={formatDate(i.fecha)}
              selected={false}
              tone={tone}
              onSelect={() => setSelectedId(i.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Mobile stack: Fechas (RG / Término) ─────────────────────────────────────

export function MobileStackFechas({
  items, colorBadge, colorDias, onEntregado, onIndeterminado,
}: {
  items: FechaItem[]
  colorBadge: string
  colorDias: string
  onEntregado?:     (id: string) => Promise<void>
  onIndeterminado?: (id: string) => Promise<void>
}) {
  const tone: "destructive" | "warning" =
    items.some(i => i.diasDiff < 0) ? "destructive" : "warning"

  const [search, setSearch] = useState("")
  const [depto, setDepto]   = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const deptos = useMemo(
    () => Array.from(new Set(items.map(i => i.departamento?.trim() || "Sin departamento"))).sort(),
    [items],
  )

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i => {
      const dep = i.departamento?.trim() || "Sin departamento"
      if (depto && dep !== depto) return false
      if (!q) return true
      return (
        i.nombre.toLowerCase().includes(q) ||
        dep.toLowerCase().includes(q) ||
        (i.puesto ?? "").toLowerCase().includes(q)
      )
    })
  }, [items, search, depto])

  const seleccionado = useMemo(
    () => items.find(i => i.id === selectedId) ?? null,
    [items, selectedId],
  )

  function back() { setSelectedId(null) }

  async function ejecutar(action?: (id: string) => Promise<void>) {
    if (!seleccionado || !action) return
    setSaving(true)
    try {
      await action(seleccionado.id)
      const idx = filtrados.findIndex(i => i.id === seleccionado.id)
      const next = filtrados[idx + 1] ?? filtrados[idx - 1] ?? null
      setSelectedId(next?.id ?? null)
    } finally {
      setSaving(false)
    }
  }

  if (seleccionado) {
    return (
      <div className="flex h-full flex-col">
        <MobileDetailHeader
          nombre={seleccionado.nombre}
          badgeLabel={seleccionado.etiqueta}
          badgeClass={colorBadge}
          onBack={back}
        />
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold ${colorBadge}`}
            >
              {iniciales(seleccionado.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">{seleccionado.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[seleccionado.puesto, seleccionado.departamento].filter(Boolean).join(" · ") || "Sin información"}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <DetalleStat label="Fecha" value={formatDate(seleccionado.fecha)} icon={<Calendar size={12} aria-hidden />} />
            <DetalleStat label="Antigüedad" value={dias(seleccionado.diasDiff)} icon={<Clock size={12} aria-hidden />} valueClass={colorDias} />
          </dl>
        </div>

        {(onEntregado || onIndeterminado) && (
          <div
            className="sticky bottom-0 flex flex-col gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            {onEntregado && (
              <Button
                onClick={() => ejecutar(onEntregado)}
                disabled={saving}
                className="h-12 w-full gap-1.5 text-base"
              >
                <CheckCircle2 size={16} aria-hidden />
                {saving ? "Guardando…" : "Marcar entregado"}
              </Button>
            )}
            {onIndeterminado && (
              <Button
                onClick={() => ejecutar(onIndeterminado)}
                disabled={saving}
                className="h-12 w-full gap-1.5 text-base"
              >
                <CheckCircle2 size={16} aria-hidden />
                {saving ? "Guardando…" : "Marcar como Indeterminado"}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <MobileToolbar
        total={items.length}
        filtrados={filtrados.length}
        search={search}
        onSearchChange={setSearch}
        depto={depto}
        onDeptoChange={setDepto}
        deptos={deptos}
      />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin resultados con los filtros actuales.
          </p>
        ) : (
          filtrados.map(i => (
            <MasterListItem
              key={i.id}
              nombre={i.nombre}
              meta={[i.puesto, i.departamento].filter(Boolean).join(" · ") || "Sin información"}
              diasLabel={dias(i.diasDiff)}
              fechaLabel={formatDate(i.fecha)}
              selected={false}
              tone={tone}
              onSelect={() => setSelectedId(i.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
