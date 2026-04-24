"use client"

import React, { useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Search, Settings2, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { confirm } from "@/components/ui/confirm-dialog"
import { useRole } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import {
  useReglasPromocionCRUD,
  type ReglaPromocionRow,
} from "@/lib/hooks/useReglasPromocionCRUD"
import { PromReglaDialog } from "./prom-regla-dialog"

interface Props {
  onChange?: () => void
}

export default function ReglasPromocionContent({ onChange }: Props) {
  const { isReadOnly } = useRole()
  const { reglas, loading, error, guardar, eliminar, toggleActivo } =
    useReglasPromocionCRUD(onChange)

  const [filter, setFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ReglaPromocionRow | null>(null)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return reglas
    return reglas.filter(
      (r) =>
        r.puesto.toLowerCase().includes(q) ||
        (r.promocion_a?.toLowerCase().includes(q) ?? false),
    )
  }, [filter, reglas])

  const puestos = useMemo(() => reglas.map((r) => r.puesto), [reglas])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(regla: ReglaPromocionRow) {
    setEditing(regla)
    setDialogOpen(true)
  }

  async function handleEliminar(regla: ReglaPromocionRow) {
    const ok = await confirm({
      title: "Eliminar regla",
      description: `¿Eliminar la regla de "${regla.puesto}"? Esta acción no se puede deshacer.`,
      tone: "destructive",
      confirmLabel: "Eliminar",
    })
    if (!ok) return
    try {
      await eliminar(regla.id)
    } catch {
      /* toast ya emitido en el hook */
    }
  }

  async function handleToggle(regla: ReglaPromocionRow, activo: boolean) {
    try {
      await toggleActivo(regla.id, activo)
    } catch {
      /* toast ya emitido en el hook */
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <ReadOnlyBanner />

        <div className="flex items-start gap-2">
          <Settings2 size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Define los criterios mínimos (temporalidad, examen, cursos, evaluación)
            para promover de un puesto a otro.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por puesto..."
              className={`pl-9 ${filter ? "pr-9" : ""}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                onClick={() => setFilter("")}
                aria-label="Limpiar filtro"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <Button
            onClick={openCreate}
            disabled={isReadOnly}
            className="h-9 gap-1.5 sm:ml-auto"
          >
            <Plus size={14} />
            Nueva regla
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Cargando reglas...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed bg-background text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-3">
              <Settings2 size={28} className="text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {reglas.length === 0 ? "Sin reglas" : "Sin coincidencias"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {reglas.length === 0
                ? "Crea la primera regla o importa un JSON desde la pestaña anterior."
                : `Ninguna regla coincide con "${filter}".`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted text-xs">
                    <TableHead>Puesto</TableHead>
                    <TableHead>Promoción a</TableHead>
                    <TableHead className="text-center">Meses</TableHead>
                    <TableHead className="text-center">Examen</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead className="text-center">Evaluación</TableHead>
                    <TableHead className="text-center">Activa</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className={r.activo ? "" : "opacity-60"}>
                      <TableCell className="font-medium">{r.puesto}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.promocion_a ?? (
                          <span className="italic text-[11px]">Sin promoción</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.min_temporalidad_meses}
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(r.min_calificacion_examen)}
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(r.min_porcentaje_cursos)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {Number(r.min_calificacion_evaluacion)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={r.activo}
                          onCheckedChange={(v) => handleToggle(r, v)}
                          disabled={isReadOnly}
                          aria-label={`Activar regla de ${r.puesto}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => openEdit(r)}
                                disabled={isReadOnly}
                                aria-label={`Editar regla de ${r.puesto}`}
                              >
                                <Pencil size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive"
                                onClick={() => handleEliminar(r)}
                                disabled={isReadOnly}
                                aria-label={`Eliminar regla de ${r.puesto}`}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-lg border p-3 space-y-2 bg-card ${r.activo ? "" : "opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.puesto}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.promocion_a ? (
                          <>→ {r.promocion_a}</>
                        ) : (
                          <span className="italic">Sin promoción</span>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={r.activo}
                      onCheckedChange={(v) => handleToggle(r, v)}
                      disabled={isReadOnly}
                      aria-label={`Activar regla de ${r.puesto}`}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    <Stat label="Meses" value={String(r.min_temporalidad_meses)} />
                    <Stat label="Examen" value={String(Number(r.min_calificacion_examen))} />
                    <Stat label="Cursos" value={`${Number(r.min_porcentaje_cursos)}%`} />
                    <Stat label="Eval." value={String(Number(r.min_calificacion_evaluacion))} />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 flex-1"
                      onClick={() => openEdit(r)}
                      disabled={isReadOnly}
                    >
                      <Pencil size={14} /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => handleEliminar(r)}
                      disabled={isReadOnly}
                      aria-label={`Eliminar regla de ${r.puesto}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-[11px]">
                {filtered.length} regla{filtered.length !== 1 ? "s" : ""}
              </Badge>
              {reglas.some((r) => !r.activo) && (
                <Badge variant="outline" className="text-[11px] opacity-70">
                  {reglas.filter((r) => !r.activo).length} inactiva
                  {reglas.filter((r) => !r.activo).length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </>
        )}

        {dialogOpen && (
          <PromReglaDialog
            open={dialogOpen}
            regla={editing}
            existingPuestos={puestos}
            isReadOnly={isReadOnly}
            onClose={() => setDialogOpen(false)}
            onGuardar={guardar}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5 text-center">
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
