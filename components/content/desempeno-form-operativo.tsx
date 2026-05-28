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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import {
  calcularPonderacion,
  type DesempenoData,
  type Objetivo,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"
import { EVALUADORES_PUESTO, DEPARTAMENTOS_EVALUADORES } from "@/lib/catalogo"
import { useRole } from "@/lib/hooks"

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  jefe: "JEFE",
  administrativo: "ADMINISTRATIVO",
  operativo: "OPERATIVO",
}

const INSTRUCCIONES =
  "La siguiente evaluación está integrada por 3 partes. En la primera deberá " +
  "anotar los objetivos SMART del puesto evaluado, así como el % del objetivo " +
  "logrado en cada uno, o su promedio durante el periodo de la presente evaluación. " +
  "La segunda parte será prellenada con la información de RH y SGI, la tercera " +
  "parte deberá ser evaluada por el jefe inmediato."

// Pasos del modal de cumplimiento que son de solo lectura
const CUMPLIMIENTO_READONLY_STEPS = new Set([2])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTipoLabel(tipo: string | undefined): string {
  return tipo ? (TIPO_LABEL[tipo] ?? tipo.toUpperCase()) : ""
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Props {
  data: DesempenoData
  onUpdate?: (data: DesempenoData) => void
}

type ModalType = "objetivos" | "cumplimiento" | "competencias" | "compromisos" | null

// ─── Animaciones ─────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-200 ${
            i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  )
}

interface InfoFieldProps {
  label: string
  children: React.ReactNode
}

function InfoField({ label, children }: InfoFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function DesempenoForm({ data, onUpdate }: Props) {
  const { isEvaluador } = useRole()
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

  // ── Handlers modales ──────────────────────────────────────────────────────

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
    if (modal === "compromisos") {
      onUpdate({ ...data, compromisos: editCompromisos, fecha_revision: editFechaRevision, observaciones: editObservaciones })
    }
    setModal(null)
  }

  // ── Navegación por pasos ──────────────────────────────────────────────────

  const totalSteps =
    modal === "objetivos" ? editObjetivos.length
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

  // ── Handler evaluador (solo campos que cambian) ───────────────────────────

  const handleEvaluadorChange = (nombre: string) => {
    onUpdate?.({
      ...data,
      evaluador_nombre: nombre,
      evaluador_puesto: EVALUADORES_PUESTO[nombre] ?? "",
    })
  }

  // ── Handler fecha con formato automático ─────────────────────────────────

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^0-9/]/g, "")
    const prev = editFechaRevision
    if (v.length > prev.length) {
      const digits = v.replace(/\//g, "")
      if (digits.length >= 2 && !v.includes("/")) {
        v = digits.slice(0, 2) + "/" + digits.slice(2)
      }
      if (digits.length >= 4) {
        v = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4)
      }
    }
    if (v.length <= 10) setEditFechaRevision(v)
  }

  // ── Incidencias agrupadas por mes ─────────────────────────────────────────

  const incidenciasPorMes =
    data.incidencias && data.incidencias.length > 0
      ? data.incidencias.reduce<Record<string, typeof data.incidencias>>((acc, inc) => {
          const key = inc.mes || "Sin mes"
          ;(acc[key] ??= []).push(inc)
          return acc
        }, {})
      : null

  const mesesOrdenados = incidenciasPorMes
    ? Object.keys(incidenciasPorMes).sort().reverse()
    : []

  // ── Botón de edición reutilizable ─────────────────────────────────────────

  const EditButton = ({ section }: { section: ModalType }) => {
    if (!canEdit) return null
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2.5"
        onClick={() => openModal(section)}
        aria-label={`Editar ${section}`}
      >
        <Pencil className="h-3.5 w-3.5" />
        Capturar
      </Button>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="print:hidden space-y-6">

        {/* ── Header ── */}
        <Card>
          <CardHeader className="space-y-3">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              <strong>Instrucciones para el evaluador:</strong> {INSTRUCCIONES}
            </p>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-base font-bold uppercase tracking-wide sm:text-lg">
                  EVALUACIÓN DE DESEMPEÑO PERSONAL {getTipoLabel(data.tipo)}
                </h1>
                <div className="text-sm text-muted-foreground">
                  Periodo de evaluación:{" "}
                  <Badge variant="secondary">{data.periodo || "—"}</Badge>
                </div>
              </div>
              <img
                src="/logo-vino-plastic.png"
                alt="Logo VIÑOPLASTIC"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoField label="Número empleado">
                <span className="text-lg font-bold">{data.numero_empleado || "—"}</span>
              </InfoField>

              <InfoField label="Nombre">
                <span className="font-bold">{data.nombre || "—"}</span>
              </InfoField>

              <InfoField label="Puesto del evaluado">
                <span className="font-bold">{data.puesto || "—"}</span>
              </InfoField>

              <InfoField label="Evaluador">
                {canEdit ? (
                  <Select
                    value={data.evaluador_nombre ?? ""}
                    onValueChange={handleEvaluadorChange}
                  >
                    <SelectTrigger aria-label="Selecciona evaluador">
                      <SelectValue placeholder="Selecciona evaluador" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEPARTAMENTOS_EVALUADORES).map(([depto, evaluadores]) => (
                        <SelectGroup key={depto}>
                          <SelectLabel className="rounded bg-muted/50 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {depto}
                          </SelectLabel>
                          {evaluadores.map((nombre) => (
                            <SelectItem key={nombre} value={nombre}>
                              {nombre}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className="font-medium"
                    role="text"
                    aria-label={`Evaluador: ${data.evaluador_nombre || "sin asignar"}`}
                  >
                    {data.evaluador_nombre || "—"}
                  </span>
                )}
                {data.evaluador_puesto && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    — {data.evaluador_puesto}
                  </p>
                )}
              </InfoField>
            </div>
          </CardContent>
        </Card>

        {/* ── Layout dos columnas ── */}
        <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">

          {/* Columna izquierda */}
          <div className="space-y-6">

            {/* PARTE 1: Objetivos (40%) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cumplimiento de Objetivos (40%)</CardTitle>
                  <EditButton section="objetivos" />
                </div>
                  <p className="text-xs text-muted-foreground mt-1">
                  Sin importar cómo se exprese el resultado (un <strong>número</strong>, <strong>días</strong>, <strong>N/A</strong>, etc.), cada objetivo debe evaluarse con un porcentaje de cumplimiento del <strong>1%</strong> al <strong>100%</strong> para considerarse válido.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Objetivos SMART</th>
                        <th className="p-2 text-left">Objetivos</th>
                        <th className="p-2 text-left">% Obtenido</th>
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
                <div className="mt-3 flex justify-between border-t pt-2 text-sm font-semibold">
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
                  <strong>Escala de evaluación (0 al 4):</strong>{" "}
                  <strong>0:</strong> Competencia no demostrada;{" "}
                  <strong>1:</strong> Aplicación ocasional;{" "}
                  <strong>2:</strong> Aplicación intermitente;{" "}
                  <strong>3:</strong> Aplicación frecuente;{" "}
                  <strong>4:</strong> Totalmente integrado en el desempeño cotidiano.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Competencia</th>
                        <th className="p-2 text-left">Cal.</th>
                        <th className="p-2 text-left">%</th>
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
                <div className="mt-3 flex justify-between border-t pt-2 text-sm font-semibold">
                  <span>Resultado promedio: {ponderacion.promedioParte3}%</span>
                  <span>Ponderado: {ponderacion.ponderadoParte3}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Incidencias — solo si hay datos y el usuario no es evaluador */}
            {incidenciasPorMes && !isEvaluador && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Incidencias</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Listado de incidencias registradas, incluye todos los periodos vigentes.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="max-h-72 overflow-y-auto space-y-3">
                    {mesesOrdenados.map((mes) => (
                      <div key={mes}>
                        <h4 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                          {mes}
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {incidenciasPorMes[mes].map((inc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
                            >
                              <span className="truncate text-xs font-medium">{inc.categoria}</span>
                              <span
                                className={`shrink-0 font-mono text-xs tabular-nums ${
                                  (inc.valor ?? 0) > 0
                                    ? "font-semibold text-destructive"
                                    : "text-muted-foreground"
                                }`}
                              >
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
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">

            {/* PARTE 2: Cumplimiento (30%) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cumplimiento de Responsabilidades (30%)</CardTitle>
                  <EditButton section="cumplimiento" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Algunos datos de esta sección son prellenados por el sistema.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Responsabilidad</th>
                        <th className="p-2 text-left">% Cump</th>
                        <th className="p-2 text-left">Evalúa</th>
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
                <div className="mt-3 flex justify-between border-t pt-2 text-sm font-semibold">
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
                <InfoField label="Compromisos / Acuerdos">
                  <p className="whitespace-pre-line">{data.compromisos || "—"}</p>
                </InfoField>
                <InfoField label="Fecha de revisión">
                  <p>{data.fecha_revision || "—"}</p>
                </InfoField>
                <InfoField label="Observaciones">
                  <p>{data.observaciones || "—"}</p>
                </InfoField>
              </CardContent>
            </Card>

            {/* Calificación Final */}
            <Card className="text-center">
              <CardContent className="pb-6 pt-6">
                <div className="text-8xl font-bold text-primary">
                  {ponderacion.calificacionFinal}%
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Calificación del periodo</strong>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ══ MODALES ══════════════════════════════════════════════════════════ */}

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
            secondaryAction={
              step > 0
                ? { icon: <ChevronLeft className="h-4 w-4" />, label: "Anterior", onClick: goPrev, iconOnly: true }
                : undefined
            }
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Resultado del periodo</Label>
                      <Input
                        value={editObjetivos[step].resultado}
                        readOnly
                        className="cursor-not-allowed bg-muted"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">% Obtenido (1-100)</Label>
                      <Input
                        value={editObjetivos[step].porcentaje === "NA" ? "" : editObjetivos[step].porcentaje}
                        onChange={(e) => {
                          const next = [...editObjetivos]
                          next[step] = { ...next[step], porcentaje: e.target.value }
                          setEditObjetivos(next)
                        }}
                        placeholder="Captura % aqui"
                      />
                    </div>
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
          description="Porcentaje de cumplimiento"
        >
          <ModalToolbar
            title="Responsabilidades"
            subtitle={`Paso ${step + 1} de ${editCumplimiento.length}`}
            saving={false}
            onClose={closeModal}
            onConfirm={goNext}
            confirmIcon={isLastStep ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            secondaryAction={
              step > 0
                ? { icon: <ChevronLeft className="h-4 w-4" />, label: "Anterior", onClick: goPrev, iconOnly: true }
                : undefined
            }
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Evalúa: {editCumplimiento[step].evalua}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">% Cumplimiento</Label>
                    {CUMPLIMIENTO_READONLY_STEPS.has(step) ? (
                      <Input
                        value={editCumplimiento[step].porcentaje}
                        readOnly
                        className="cursor-not-allowed bg-muted"
                      />
                    ) : (
                      <Input
                        value={editCumplimiento[step].porcentaje === "NA" ? "" : editCumplimiento[step].porcentaje}
                        onChange={(e) => {
                          const next = [...editCumplimiento]
                          next[step] = { ...next[step], porcentaje: e.target.value }
                          setEditCumplimiento(next)
                        }}
                        placeholder="Captura % aqui"
                      />
                    )}
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
            secondaryAction={
              step > 0
                ? { icon: <ChevronLeft className="h-4 w-4" />, label: "Anterior", onClick: goPrev, iconOnly: true }
                : undefined
            }
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
                        value={editCompetencias[step].calificacion === 0 ? "" : editCompetencias[step].calificacion}
                        onChange={(e) => {
                          const val = Math.min(4, Math.max(0, parseInt(e.target.value) || 0))
                          const next = [...editCompetencias]
                          next[step] = { ...next[step], calificacion: val }
                          setEditCompetencias(next)
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">% Equivalente</Label>
                      <div className="mt-2 text-sm font-semibold">
                        {Math.round((editCompetencias[step].calificacion / 4) * 100)}%
                      </div>
                    </div>
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
                onChange={handleFechaChange}
                placeholder="DD/MM/AAAA"
                maxLength={10}
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
