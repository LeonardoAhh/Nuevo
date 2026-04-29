"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  calcularPonderacion,
  type DesempenoData,
  type Objetivo,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"

interface Props {
  data: DesempenoData
  onUpdate?: (data: DesempenoData) => void
}

type ModalType = "objetivos" | "cumplimiento" | "competencias" | "compromisos" | null

export function DesempenoForm({ data, onUpdate }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [editObjetivos, setEditObjetivos] = useState<Objetivo[]>([])
  const [editCumplimiento, setEditCumplimiento] = useState<CumplimientoItem[]>([])
  const [editCompetencias, setEditCompetencias] = useState<Competencia[]>([])
  const [editCompromisos, setEditCompromisos] = useState("")
  const [editFechaRevision, setEditFechaRevision] = useState("")
  const [editObservaciones, setEditObservaciones] = useState("")

  const ponderacion = calcularPonderacion(data)
  const canEdit = !!onUpdate

  const openModal = (type: ModalType) => {
    if (!canEdit) return
    if (type === "objetivos") setEditObjetivos(data.objetivos.map((o) => ({ ...o })))
    if (type === "cumplimiento") setEditCumplimiento(data.cumplimiento_responsabilidades.map((c) => ({ ...c })))
    if (type === "competencias") setEditCompetencias(data.competencias.map((c) => ({ ...c })))
    if (type === "compromisos") {
      setEditCompromisos(data.compromisos)
      setEditFechaRevision(data.fecha_revision)
      setEditObservaciones(data.observaciones)
    }
    setModal(type)
  }

  const saveModal = () => {
    if (!onUpdate) return
    if (modal === "objetivos") onUpdate({ ...data, objetivos: editObjetivos })
    if (modal === "cumplimiento") onUpdate({ ...data, cumplimiento_responsabilidades: editCumplimiento })
    if (modal === "competencias") onUpdate({ ...data, competencias: editCompetencias })
    if (modal === "compromisos") onUpdate({ ...data, compromisos: editCompromisos, fecha_revision: editFechaRevision, observaciones: editObservaciones })
    setModal(null)
  }

  const EditButton = ({ section }: { section: ModalType }) => {
    if (!canEdit) return null
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModal(section)} aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider>
    <div className="print:hidden space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">EVALUACIÓN DE DESEMPEÑO</h1>
              <p className="text-muted-foreground">Personal {data.tipo === 'jefe' ? 'Jefes' : data.tipo === 'administrativo' ? 'Administrativo' : 'Operativo'}</p>
            </div>
            <Badge variant="secondary">{data.periodo || "Sin periodo"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Número empleado</Label>
              <div className="font-bold text-lg">{data.numero_empleado || "—"}</div>
            </div>
            <div>
              <Label>Nombre</Label>
              <div className="font-bold">{data.nombre || "—"}</div>
            </div>
            <div>
              <Label>Puesto evaluado</Label>
              <div className="font-bold">{data.puesto || "—"}</div>
            </div>
            <div>
              <Label>Evaluador</Label>
              <div>{data.evaluador_nombre || "—"} {data.evaluador_puesto ? `- ${data.evaluador_puesto}` : ""}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
        {/* Left column */}
        <div className="space-y-6">
          {/* PARTE 1: Objetivos (40%) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Primera parte — Objetivos SMART (40%)</CardTitle>
                <EditButton section="objetivos" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Objetivo</th>
                      <th className="text-left p-2">Resultado</th>
                      <th className="text-left p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.objetivos.map((obj, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-2 py-2 text-muted-foreground">{obj.numero}</td>
                        <td className="px-2 py-2">{obj.descripcion}</td>
                        <td className="px-2 py-2">{obj.resultado}</td>
                        <td className="px-2 py-2">{obj.porcentaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-between text-sm font-semibold border-t pt-2">
                <span>Resultado promedio: {ponderacion.promedioParte1}%</span>
                <span>Ponderado: {ponderacion.ponderadoParte1}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Incidencias */}
          {data.incidencias && data.incidencias.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Incidencias recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {data.incidencias.map((inc, idx) => (
                    <div key={idx} className="rounded-lg border border-border p-3">
                      <div className="text-sm font-semibold">{inc.categoria}</div>
                      <div className="text-sm">Mes: {inc.mes || "—"}</div>
                      <div className="text-sm">Valor: {inc.valor ?? "NA"}</div>
                      <div className="text-sm text-muted-foreground">{inc.notas || "Sin notas"}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* PARTE 2: Cumplimiento (30%) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Segunda parte — Responsabilidades (30%)</CardTitle>
                <EditButton section="cumplimiento" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Responsabilidad</th>
                      <th className="text-left p-2">% Cump</th>
                      <th className="text-left p-2">Evalúa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cumplimiento_responsabilidades.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-2 py-2">{item.descripcion}</td>
                        <td className="px-2 py-2">{item.porcentaje}</td>
                        <td className="px-2 py-2">{item.evalua}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-between text-sm font-semibold border-t pt-2">
                <span>Resultado promedio: {ponderacion.promedioParte2}%</span>
                <span>Ponderado: {ponderacion.ponderadoParte2}%</span>
              </div>
            </CardContent>
          </Card>

          {/* PARTE 3: Competencias (30%) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tercera parte — Competencias (30%)</CardTitle>
                <EditButton section="competencias" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Competencia</th>
                      <th className="text-left p-2">Cal.</th>
                      <th className="text-left p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.competencias.map((comp, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-2 py-2">{comp.nombre}</td>
                        <td className="px-2 py-2">{comp.calificacion}/4</td>
                        <td className="px-2 py-2">{Math.round((comp.calificacion / 4) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-between text-sm font-semibold border-t pt-2">
                <span>Resultado promedio: {ponderacion.promedioParte3}%</span>
                <span>Ponderado: {ponderacion.ponderadoParte3}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Compromisos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Compromisos y observaciones</CardTitle>
                <EditButton section="compromisos" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label>Compromisos / Acuerdos</Label>
                <p>{data.compromisos || "—"}</p>
              </div>
              <div>
                <Label>Fecha de revisión</Label>
                <p>{data.fecha_revision || "—"}</p>
              </div>
              <div>
                <Label>Observaciones</Label>
                <p>{data.observaciones || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Calificación Final */}
          <Card className="text-center">
            <CardContent className="pt-6 pb-6">
              <div className="text-4xl font-bold text-primary">{ponderacion.calificacionFinal}%</div>
              <p className="text-muted-foreground mt-1 text-sm">Calificación del periodo</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Parte 1: {ponderacion.ponderadoParte1}%</div>
                <div>Parte 2: {ponderacion.ponderadoParte2}%</div>
                <div>Parte 3: {ponderacion.ponderadoParte3}%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ MODALES ═══ */}

      {/* Modal Objetivos */}
      <Dialog open={modal === "objetivos"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Objetivos SMART</DialogTitle>
            <DialogDescription>Captura resultado y porcentaje obtenido para cada objetivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editObjetivos.map((obj, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm font-medium">Objetivo {obj.numero}: {obj.descripcion}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Resultado del periodo</Label>
                    <Input
                      value={obj.resultado}
                      onChange={(e) => {
                        const next = [...editObjetivos]
                        next[i] = { ...next[i], resultado: e.target.value }
                        setEditObjetivos(next)
                      }}
                      placeholder="Ej: 80%"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">% Obtenido (1-100)</Label>
                    <Input
                      value={obj.porcentaje}
                      onChange={(e) => {
                        const next = [...editObjetivos]
                        next[i] = { ...next[i], porcentaje: e.target.value }
                        setEditObjetivos(next)
                      }}
                      placeholder="Ej: 80"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Comentarios</Label>
                  <Input
                    value={obj.comentarios}
                    onChange={(e) => {
                      const next = [...editObjetivos]
                      next[i] = { ...next[i], comentarios: e.target.value }
                      setEditObjetivos(next)
                    }}
                    placeholder="Comentarios"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={saveModal}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cumplimiento */}
      <Dialog open={modal === "cumplimiento"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cumplimiento de responsabilidades</DialogTitle>
            <DialogDescription>Captura el porcentaje de cumplimiento y comentarios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editCumplimiento.map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm font-medium">{item.descripcion}</p>
                <div className="text-xs text-muted-foreground">Evalúa: {item.evalua}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">% Cumplimiento</Label>
                    <Input
                      value={item.porcentaje}
                      onChange={(e) => {
                        const next = [...editCumplimiento]
                        next[i] = { ...next[i], porcentaje: e.target.value }
                        setEditCumplimiento(next)
                      }}
                      placeholder="Ej: 80"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Comentarios</Label>
                    <Input
                      value={item.comentarios}
                      onChange={(e) => {
                        const next = [...editCumplimiento]
                        next[i] = { ...next[i], comentarios: e.target.value }
                        setEditCumplimiento(next)
                      }}
                      placeholder="Comentarios"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={saveModal}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Competencias */}
      <Dialog open={modal === "competencias"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Competencias blandas</DialogTitle>
            <DialogDescription>Calificación del 0 al 4. (0=No demostrada, 1=Pocas veces, 2=Mitad, 3=Mayoría, 4=Integrado)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editCompetencias.map((comp, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm font-medium">{comp.nombre}</p>
                <p className="text-xs text-muted-foreground">{comp.descripcion}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Calificación (0-4)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={comp.calificacion}
                      onChange={(e) => {
                        const val = Math.min(4, Math.max(0, parseInt(e.target.value) || 0))
                        const next = [...editCompetencias]
                        next[i] = { ...next[i], calificacion: val }
                        setEditCompetencias(next)
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">% Equivalente</Label>
                    <div className="text-sm font-semibold mt-2">{Math.round((comp.calificacion / 4) * 100)}%</div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Comentarios</Label>
                  <Input
                    value={comp.comentarios}
                    onChange={(e) => {
                      const next = [...editCompetencias]
                      next[i] = { ...next[i], comentarios: e.target.value }
                      setEditCompetencias(next)
                    }}
                    placeholder="Comentarios"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={saveModal}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Compromisos */}
      <Dialog open={modal === "compromisos"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compromisos y observaciones</DialogTitle>
            <DialogDescription>Registra compromisos, acuerdos y fechas de revisión.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Compromisos / Acuerdos</Label>
              <Textarea
                value={editCompromisos}
                onChange={(e) => setEditCompromisos(e.target.value)}
                placeholder="Compromisos del evaluado..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>Fecha de revisión</Label>
              <Input
                value={editFechaRevision}
                onChange={(e) => setEditFechaRevision(e.target.value)}
                placeholder="DD/MM/AAAA"
              />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={editObservaciones}
                onChange={(e) => setEditObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={saveModal}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
