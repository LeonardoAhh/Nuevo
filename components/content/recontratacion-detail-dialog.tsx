import { AlertCircle, Loader2, Printer } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/hooks"
import { INCIDENCIA_COLUMNS, formatMesLargo } from "@/lib/recontratacion"
import {
  evaluarRecomendacion,
  EVAL_THRESHOLDS,
  type DetalleState,
} from "@/components/content/recontratacion-logic"
import { Dato, RECO_META, SectionTitle } from "@/components/content/recontratacion-ui"

export function DetalleDialog({
  state,
  onClose,
  onImprimir,
}: {
  state: DetalleState
  onClose: () => void
  onImprimir: (numero: string) => void
}) {
  const isOpen = state.status !== "closed"
  const data = state.status === "ready" ? state.data : null
  const recommendation = data ? evaluarRecomendacion(data) : null
  const RecommendationIcon = recommendation ? RECO_META[recommendation].icon : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-card p-0 sm:max-w-4xl">
        <div className="sticky top-0 z-10 border-b border-border bg-card p-4 md:p-6">
          <DialogHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                  {data?.nombre ?? "Detalle de empleado"}
                  {recommendation && (
                    <Badge
                      variant="outline"
                      className={cn("gap-2 text-xs font-medium", RECO_META[recommendation].classes)}
                    >
                      {RecommendationIcon && (
                        <RecommendationIcon className="size-4" aria-hidden="true" />
                      )}
                      {RECO_META[recommendation].label}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Vista previa · Formato de continuidad de contrato
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 md:p-6">
          {state.status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              <p className="text-sm" role="status">Cargando información…</p>
            </div>
          )}

          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {state.status === "ready" && data && (
            <div className="space-y-8 text-sm">
              <section aria-labelledby="sec-datos">
                <SectionTitle>
                  <span id="sec-datos">Datos generales</span>
                </SectionTitle>
                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
                  <Dato label="No. empleado" value={data.numero || "—"} />
                  <Dato label="Puesto" value={data.puesto || "—"} />
                  <Dato label="Departamento" value={data.departamento || "—"} />
                  <Dato label="Turno" value={data.turno || "—"} />
                  <Dato label="Fecha ingreso" value={formatDate(data.fechaIngresoISO)} />
                  <Dato label="Término contrato" value={formatDate(data.terminoContratoISO)} />
                  <Dato label="Jefe directo" value={data.jefeDirecto || "—"} />
                  <Dato label="RG-REC-048" value={data.rgEntregado || "—"} />
                </dl>
              </section>

              <section aria-labelledby="sec-incidencias">
                <SectionTitle>
                  <span id="sec-incidencias">Incidencias — primeros 90 días</span>
                </SectionTitle>
                <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th scope="col" className="w-24 px-3 py-3 text-left font-sans text-xs font-medium uppercase text-muted-foreground">
                          Mes
                        </th>
                        {INCIDENCIA_COLUMNS.map((column) => (
                          <th
                            key={column.header}
                            scope="col"
                            className="px-3 py-3 text-center font-sans text-xs font-medium uppercase leading-tight text-muted-foreground"
                          >
                            {column.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.incidencias.length === 0 ? (
                        <tr>
                          <td
                            colSpan={INCIDENCIA_COLUMNS.length + 1}
                            className="px-3 py-4 text-center text-muted-foreground"
                          >
                            Sin periodo registrado — falta fecha de ingreso
                          </td>
                        </tr>
                      ) : (
                        data.incidencias.map((month) => (
                          <tr key={month.mes} className="border-t border-border transition-colors hover:bg-muted/30">
                            <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                              {formatMesLargo(month.mes)}
                            </td>
                            {INCIDENCIA_COLUMNS.map((column) => {
                              const value = month.valores[column.categoria]
                              const isUnexcusedAbsence = column.categoria === "FALTA INJUSTIFICADA"
                              return (
                                <td key={column.header} className="px-3 py-3 text-center">
                                  {value ? (
                                    <span className={cn(
                                      "font-semibold",
                                      isUnexcusedAbsence ? "text-destructive" : "text-foreground",
                                    )}>
                                      {value}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground" aria-label="Sin valor">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-labelledby="sec-evaluaciones">
                <SectionTitle>
                  <span id="sec-evaluaciones">Evaluaciones de desempeño</span>
                </SectionTitle>
                <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th scope="col" className="w-8 px-3 py-3 text-left font-sans text-xs font-medium uppercase text-muted-foreground">#</th>
                        <th scope="col" className="px-3 py-3 text-left font-sans text-xs font-medium uppercase text-muted-foreground">Periodo</th>
                        <th scope="col" className="px-3 py-3 text-center font-sans text-xs font-medium uppercase text-muted-foreground">Calificación</th>
                        <th scope="col" className="px-3 py-3 text-left font-sans text-xs font-medium uppercase text-muted-foreground">Plan de seguimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.evaluaciones.map((evaluation, index) => (
                        <tr key={index} className="border-t border-border transition-colors hover:bg-muted/30">
                          <td className="px-3 py-3 text-muted-foreground">{index + 1}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-foreground">
                            {evaluation.periodo.label || "—"}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {evaluation.calificacion != null ? (
                              <span className={cn(
                                "font-semibold",
                                evaluation.calificacion >= EVAL_THRESHOLDS.minPass
                                  ? "text-foreground"
                                  : "text-destructive",
                              )}>
                                {evaluation.calificacion}
                              </span>
                            ) : (
                              <span className="text-muted-foreground" aria-label="Sin calificación">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {evaluation.planSeguimiento || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 md:flex-row md:items-center">
                <p className="text-sm text-muted-foreground">
                  Recomendación orientativa — la decisión final corresponde al Jefe de Departamento.
                </p>
                <Button
                  onClick={() => data.numero && onImprimir(data.numero)}
                  disabled={!data.numero}
                  size="sm"
                  className="h-11 shrink-0 gap-2 px-4 py-0 text-sm"
                >
                  <Printer className="size-4" aria-hidden="true" />
                  Imprimir formato
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
