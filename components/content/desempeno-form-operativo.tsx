"use client"

import { useState } from "react"
import { Pencil, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import {
  calcularPonderacion,
  type DesempenoData,
  type Objetivo,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"
import { EVALUADORES_DESEMPENO, EVALUADORES_PUESTO } from "@/lib/catalogo"

interface Props {
  data: DesempenoData
  onUpdate?: (data: DesempenoData) => void
}
import styles from "./desempeno-print.module.css"

type ModalType = "objetivos" | "cumplimiento" | "competencias" | "compromisos" | null

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-200 ${i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
        />
      ))}
    </div>
  )
}

export function DesempenoForm({ data, onUpdate }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
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
    setStep(0)
    setDirection(1)
    setModal(type)
  }

  const closeModal = () => setModal(null)

  const saveModal = () => {
    if (!onUpdate) return
    if (modal === "objetivos") onUpdate({ ...data, objetivos: editObjetivos })
    if (modal === "cumplimiento") onUpdate({ ...data, cumplimiento_responsabilidades: editCumplimiento })
    if (modal === "competencias") onUpdate({ ...data, competencias: editCompetencias })
    if (modal === "compromisos") onUpdate({ ...data, compromisos: editCompromisos, fecha_revision: editFechaRevision, observaciones: editObservaciones })
    setModal(null)
  }

  const totalSteps = modal === "objetivos" ? editObjetivos.length
    : modal === "cumplimiento" ? editCumplimiento.length
      : modal === "competencias" ? editCompetencias.length
        : 1
  const isLastStep = step >= totalSteps - 1

  const goNext = () => {
    if (isLastStep) { saveModal(); return }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goPrev = () => {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
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
            {/* Instrucciones */}
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              <strong>Instrucciones para el evaluador:</strong> La siguiente evaluación está integrada por 3 partes. En la primera deberá anotar los objetivos SMART del puesto evaluado, así como el % del objetivo logrado en cada uno, o su promedio durante el periodo de la presente evaluación. La segunda parte será prellenada con la información de RH y SGI, la tercera parte deberá ser evaluada por el jefe inmediato.
            </p>
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <h1>EVALUACIÓN DE DESEMPEÑO PERSONAL {data.tipo === 'jefe' ? 'JEFE' : data.tipo === 'administrativo' ? 'ADMINISTRATIVO' : 'OPERATIVO'}</h1>
                <p>Periodo de evaluación: <span className={styles.periodBadge}>{data.periodo || '—'}</span></p>
              </div>
              <div className={styles.headerRight}>
                <img src="/logo-vino-plastic.png" alt="Logo" className={styles.logo} />
              </div>
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
                <Label>Puesto del evaluado</Label>
                <div className="font-bold">{data.puesto || "—"}</div>
              </div>
              <div>
                <Label>Evaluador</Label>
                {canEdit ? (
                  <Select
                    value={data.evaluador_nombre || ""}
                    onValueChange={(value) => onUpdate?.({ ...data, evaluador_nombre: value, evaluador_puesto: EVALUADORES_PUESTO[value] || "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona evaluador" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVALUADORES_DESEMPENO.map((evaluador) => (
                        <SelectItem key={evaluador} value={evaluador}>
                          {evaluador}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>{data.evaluador_nombre || "—"}</div>
                )}
                <div className="text-sm text-muted-foreground">{data.evaluador_puesto ? `- ${data.evaluador_puesto}` : ""}</div>
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
                  <CardTitle className="text-base">Cumplimiento de Objetivos (40%)</CardTitle>
                  <EditButton section="objetivos" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Los objetivos en <strong>0</strong> o <strong>N/A</strong> deben cambiarse por un porcentaje del <strong>1%</strong> al <strong>100%</strong> para considerarse cumplidos.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Objetivos SMART</th>
                        <th className="text-left p-2">Objetivos</th>
                        <th className="text-left p-2">% Obtenido</th>
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

            {/* PARTE 3: Competencias (30%) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Competencias Blandas (30%)</CardTitle>
                  <EditButton section="competencias" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Escala de evaluación (0 al 4):</strong> <strong>0:</strong> Competencia no demostrada; <strong>1:</strong> Aplicación ocasional; <strong>2:</strong> Aplicación intermitente; <strong>3:</strong> Aplicación frecuente; <strong>4:</strong> Totalmente integrado en el desempeño cotidiano.
                </p>
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

            {/* Incidencias */}
            {data.incidencias && data.incidencias.length > 0 && (() => {
              const porMes = data.incidencias.reduce<Record<string, typeof data.incidencias>>((acc, inc) => {
                const key = inc.mes || "Sin mes"
                  ; (acc[key] ??= []).push(inc)
                return acc
              }, {})
              const meses = Object.keys(porMes).sort().reverse()
              return (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Incidencias</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Listado de incidencias registradas, incluye todos los periodos vigentes.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-72 overflow-y-auto space-y-3">
                      {meses.map((mes) => (
                        <div key={mes}>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">{mes}</h4>
                          <div className="grid grid-cols-2 gap-1.5">
                            {porMes[mes].map((inc, idx) => (
                              <div key={idx} className="rounded-md border border-border px-2.5 py-1.5 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium truncate">{inc.categoria}</span>
                                <span className={`text-xs font-mono tabular-nums shrink-0 ${(inc.valor ?? 0) > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                  {inc.valor ?? 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* PARTE 2: Cumplimiento (30%) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cumplimiento de Responsabilidades (30%)</CardTitle>
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

            {/* Compromisos */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Compromisos y observaciones</CardTitle>
                  <EditButton section="compromisos" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Describa los compromisos y planes de acción acordados para fortalecer aquellos factores que obtuvieron una menor calificación.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label>Compromisos / Acuerdos</Label>
                  <p className="whitespace-pre-line">{data.compromisos || "—"}</p>
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
                <div className="text-8xl font-bold text-primary">{ponderacion.calificacionFinal}%</div>
                <p className="text-muted-foreground mt-2 text-sm"><strong>Calificación del periodo</strong></p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ MODALES EN STEPS ═══ */}

        {/* Modal Objetivos */}
        <ResponsiveShell
          open={modal === "objetivos"}
          onClose={closeModal}
          maxWidth="sm:max-w-md"
          title="Objetivos SMART"
          description="Captura resultado y porcentaje por objetivo"
        >
          <ModalToolbar
            title="Objetivos SMART"
            subtitle={`Paso ${step + 1} de ${editObjetivos.length}`}
            saving={false}
            onClose={closeModal}
            onConfirm={goNext}
            confirmIcon={isLastStep ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            secondaryAction={step > 0 ? {
              icon: <ChevronLeft className="h-4 w-4" />,
              label: "Anterior",
              onClick: goPrev,
              iconOnly: true,
            } : undefined}
          />
          <StepDots total={editObjetivos.length} current={step} />
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {editObjetivos[step] && (
                <motion.div
                  key={`obj-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-sm font-medium">Objetivo {editObjetivos[step].numero}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{editObjetivos[step].descripcion}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Resultado del periodo</Label>
                    <Input
                      value={editObjetivos[step].resultado}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">% Obtenido (1-100)</Label>
                    <Input
                      value={editObjetivos[step].porcentaje}
                      onChange={(e) => {
                        const next = [...editObjetivos]
                        next[step] = { ...next[step], porcentaje: e.target.value }
                        setEditObjetivos(next)
                      }}
                      placeholder="Ej: 80"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Comentarios</Label>
                    <Input
                      value={editObjetivos[step].comentarios}
                      onChange={(e) => {
                        const next = [...editObjetivos]
                        next[step] = { ...next[step], comentarios: e.target.value }
                        setEditObjetivos(next)
                      }}
                      placeholder="Comentarios"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ResponsiveShell>

        {/* Modal Cumplimiento */}
        <ResponsiveShell
          open={modal === "cumplimiento"}
          onClose={closeModal}
          maxWidth="sm:max-w-md"
          title="Responsabilidades"
          description="Porcentaje de cumplimiento y comentarios"
        >
          <ModalToolbar
            title="Responsabilidades"
            subtitle={`Paso ${step + 1} de ${editCumplimiento.length}`}
            saving={false}
            onClose={closeModal}
            onConfirm={goNext}
            confirmIcon={isLastStep ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            secondaryAction={step > 0 ? {
              icon: <ChevronLeft className="h-4 w-4" />,
              label: "Anterior",
              onClick: goPrev,
              iconOnly: true,
            } : undefined}
          />
          <StepDots total={editCumplimiento.length} current={step} />
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {editCumplimiento[step] && (
                <motion.div
                  key={`cump-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-sm font-medium">{editCumplimiento[step].descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Evalúa: {editCumplimiento[step].evalua}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">% Cumplimiento</Label>
                    {step === 2 || step === 4 ? (
                      <Input
                        value={editCumplimiento[step].porcentaje}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    ) : (
                      <Input
                        value={editCumplimiento[step].porcentaje}
                        onChange={(e) => {
                          const next = [...editCumplimiento]
                          next[step] = { ...next[step], porcentaje: e.target.value }
                          setEditCumplimiento(next)
                        }}
                        placeholder="Ej: 80"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Comentarios</Label>
                    <Input
                      value={editCumplimiento[step].comentarios}
                      onChange={(e) => {
                        const next = [...editCumplimiento]
                        next[step] = { ...next[step], comentarios: e.target.value }
                        setEditCumplimiento(next)
                      }}
                      placeholder="Comentarios"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ResponsiveShell>

        {/* Modal Competencias */}
        <ResponsiveShell
          open={modal === "competencias"}
          onClose={closeModal}
          maxWidth="sm:max-w-md"
          title="Competencias"
          description="Calificación del 0 al 4"
        >
          <ModalToolbar
            title="Competencias"
            subtitle={`Paso ${step + 1} de ${editCompetencias.length}`}
            saving={false}
            onClose={closeModal}
            onConfirm={goNext}
            confirmIcon={isLastStep ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            secondaryAction={step > 0 ? {
              icon: <ChevronLeft className="h-4 w-4" />,
              label: "Anterior",
              onClick: goPrev,
              iconOnly: true,
            } : undefined}
          />
          <StepDots total={editCompetencias.length} current={step} />
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {editCompetencias[step] && (
                <motion.div
                  key={`comp-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-sm font-medium">{editCompetencias[step].nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{editCompetencias[step].descripcion}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Calificación (0-4)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={4}
                        value={editCompetencias[step].calificacion}
                        onChange={(e) => {
                          const val = Math.min(4, Math.max(0, parseInt(e.target.value) || 0))
                          const next = [...editCompetencias]
                          next[step] = { ...next[step], calificacion: val }
                          setEditCompetencias(next)
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">% Equivalente</Label>
                      <div className="text-sm font-semibold mt-2">{Math.round((editCompetencias[step].calificacion / 4) * 100)}%</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Comentarios</Label>
                    <Input
                      value={editCompetencias[step].comentarios}
                      onChange={(e) => {
                        const next = [...editCompetencias]
                        next[step] = { ...next[step], comentarios: e.target.value }
                        setEditCompetencias(next)
                      }}
                      placeholder="Comentarios"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ResponsiveShell>

        {/* Modal Compromisos */}
        <ResponsiveShell
          open={modal === "compromisos"}
          onClose={closeModal}
          maxWidth="sm:max-w-md"
          title="Compromisos"
          description="Registra compromisos, acuerdos y fechas"
        >
          <ModalToolbar
            title="Compromisos"
            subtitle="Acuerdos y observaciones"
            saving={false}
            onClose={closeModal}
            onConfirm={saveModal}
            confirmIcon={<Check className="h-4 w-4" />}
          />
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Compromisos / Acuerdos</Label>
              <Textarea
                value={editCompromisos}
                onChange={(e) => setEditCompromisos(e.target.value)}
                placeholder="Compromisos del evaluado..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha de revisión</Label>
              <Input
                value={editFechaRevision}
                onChange={(e) => setEditFechaRevision(e.target.value)}
                placeholder="DD/MM/AAAA"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observaciones</Label>
              <Textarea
                value={editObservaciones}
                onChange={(e) => setEditObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </ResponsiveShell>
      </div>
    </TooltipProvider>
  )
}