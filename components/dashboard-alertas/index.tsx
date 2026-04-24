"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  RefreshCw,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModalToolbar, ResponsiveShell } from "@/components/ui/responsive-shell"
import {
  EVAL_UMBRAL_DIAS,
  RG_UMBRAL_DIAS,
  TERMINO_UMBRAL_DIAS,
  type DialogTipo,
} from "@/lib/hooks/useDashboardAlertas"
import { useDashboardAlertasShared } from "@/components/dashboard-alertas-context"
import { Seccion } from "./shared"
import { ListaEvals, ListaFechasPorDepto } from "./listas"

// Main entry for the dashboard Alertas tab.
// Split across 5 sibling files (utils, shared, desktop-master-detail,
// mobile-stack, listas) to keep each module focused and maintainable.

export default function DashboardAlertas() {
  const {
    loading, dialogTipo, setDialogTipo, cargarDatos,
    eval1Venc, eval1Prox, setEval1Venc, setEval1Prox,
    eval2Venc, eval2Prox, setEval2Venc, setEval2Prox,
    eval3Venc, eval3Prox, setEval3Venc, setEval3Prox,
    rgVenc, rgProx, setRgVenc, setRgProx,
    termVenc, termProx, setTermVenc, setTermProx,
    totalAlertas,
    calificarEval, marcarRgEntregado, marcarIndeterminado,
  } = useDashboardAlertasShared()

  // ── Dialog config ──────────────────────────────────────────────────────────

  const n = (arr: unknown[]) => arr.length
  const s = (arr: unknown[], word: string) =>
    `${n(arr)} ${word}${n(arr) !== 1 ? "s" : ""}`

  const dialogConfig: Record<NonNullable<DialogTipo>, {
    titulo: string; descripcion: string; icono: React.ReactNode
  }> = {
    eval1_vencidas:     { titulo: "Evaluación 1er Mes — Vencidas",
                          descripcion: `${s(eval1Venc,"evaluación")} con fecha pasada sin calificación`,
                          icono: <XCircle className="h-5 w-5 text-red-500" /> },
    eval1_por_vencer:   { titulo: `Evaluación 1er Mes — Por vencer (${EVAL_UMBRAL_DIAS}d)`,
                          descripcion: `${s(eval1Prox,"evaluación")} próximas a vencer`,
                          icono: <Clock className="h-5 w-5 text-amber-500" /> },
    eval2_vencidas:     { titulo: "Evaluación 2° Mes — Vencidas",
                          descripcion: `${s(eval2Venc,"evaluación")} con fecha pasada sin calificación`,
                          icono: <XCircle className="h-5 w-5 text-red-500" /> },
    eval2_por_vencer:   { titulo: `Evaluación 2° Mes — Por vencer (${EVAL_UMBRAL_DIAS}d)`,
                          descripcion: `${s(eval2Prox,"evaluación")} próximas a vencer`,
                          icono: <Clock className="h-5 w-5 text-amber-500" /> },
    eval3_vencidas:     { titulo: "Evaluación 3er Mes — Vencidas",
                          descripcion: `${s(eval3Venc,"evaluación")} con fecha pasada sin calificación`,
                          icono: <XCircle className="h-5 w-5 text-red-500" /> },
    eval3_por_vencer:   { titulo: `Evaluación 3er Mes — Por vencer (${EVAL_UMBRAL_DIAS}d)`,
                          descripcion: `${s(eval3Prox,"evaluación")} próximas a vencer`,
                          icono: <Clock className="h-5 w-5 text-amber-500" /> },
    rg_vencidas:        { titulo: "RG-REC-048 — Pendientes vencidos",
                          descripcion: `${s(rgVenc,"registro")} con RG pendiente y fecha vencida`,
                          icono: <ShieldAlert className="h-5 w-5 text-purple-500" /> },
    rg_por_vencer:      { titulo: `RG-REC-048 — Por vencer (${RG_UMBRAL_DIAS}d)`,
                          descripcion: `${s(rgProx,"registro")} con RG próximo a vencer`,
                          icono: <Clock className="h-5 w-5 text-violet-500" /> },
    termino_vencidos:   { titulo: "Término de Contrato — Vencidos",
                          descripcion: `${s(termVenc,"contrato")} con fecha de término pasada`,
                          icono: <AlertTriangle className="h-5 w-5 text-orange-500" /> },
    termino_por_vencer: { titulo: `Término de Contrato — Por vencer (${TERMINO_UMBRAL_DIAS}d)`,
                          descripcion: `${s(termProx,"contrato")} próximos a vencer`,
                          icono: <Calendar className="h-5 w-5 text-blue-500" /> },
  }

  const dialogActivo = dialogTipo ? dialogConfig[dialogTipo] : null

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Alertas de Vencimiento
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Haz clic en una métrica para ver el detalle
            </p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={cargarDatos} disabled={loading} title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 pt-0 md:grid-cols-2 xl:grid-cols-3">
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-primary" />}
            label="Evaluación 1er Mes"
            vencidas={n(eval1Venc)}   colorV="text-red-600 dark:text-red-400"
            bordeV="border-red-100 dark:border-red-800/30"
            porVencer={n(eval1Prox)}  colorP="text-amber-600 dark:text-amber-400"
            bordeP="border-amber-100 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval1_vencidas")}
            onPorVencer={() => setDialogTipo("eval1_por_vencer")}
            loading={loading}
          />
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-primary" />}
            label="Evaluación 2° Mes"
            vencidas={n(eval2Venc)}   colorV="text-red-600 dark:text-red-400"
            bordeV="border-red-100 dark:border-red-800/30"
            porVencer={n(eval2Prox)}  colorP="text-amber-600 dark:text-amber-400"
            bordeP="border-amber-100 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval2_vencidas")}
            onPorVencer={() => setDialogTipo("eval2_por_vencer")}
            loading={loading}
          />
          <Seccion
            icono={<GraduationCap className="h-3.5 w-3.5 text-primary" />}
            label="Evaluación 3er Mes"
            vencidas={n(eval3Venc)}   colorV="text-red-600 dark:text-red-400"
            bordeV="border-red-100 dark:border-red-800/30"
            porVencer={n(eval3Prox)}  colorP="text-amber-600 dark:text-amber-400"
            bordeP="border-amber-100 dark:border-amber-800/30"
            umbrales={EVAL_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("eval3_vencidas")}
            onPorVencer={() => setDialogTipo("eval3_por_vencer")}
            loading={loading}
          />
          <Seccion
            icono={<ShieldAlert className="h-3.5 w-3.5 text-primary" />}
            label="RG-REC-048"
            vencidas={n(rgVenc)}     colorV="text-purple-600 dark:text-purple-400"
            bordeV="border-purple-100 dark:border-purple-800/30"
            porVencer={n(rgProx)}    colorP="text-violet-600 dark:text-violet-400"
            bordeP="border-violet-100 dark:border-violet-800/30"
            umbrales={RG_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("rg_vencidas")}
            onPorVencer={() => setDialogTipo("rg_por_vencer")}
            loading={loading}
          />
          <Seccion
            icono={<FileText className="h-3.5 w-3.5 text-primary" />}
            label="Término de Contrato"
            vencidas={n(termVenc)}   colorV="text-orange-600 dark:text-orange-400"
            bordeV="border-orange-100 dark:border-orange-800/30"
            porVencer={n(termProx)}  colorP="text-blue-600 dark:text-blue-400"
            bordeP="border-blue-100 dark:border-blue-800/30"
            umbrales={TERMINO_UMBRAL_DIAS}
            onVencidas={() => setDialogTipo("termino_vencidos")}
            onPorVencer={() => setDialogTipo("termino_por_vencer")}
            loading={loading}
          />

          {!loading && totalAlertas === 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
              <CheckCircle2 size={16} />
              <span>Sin alertas pendientes. ¡Todo al día!</span>
            </div>
          )}
        </CardContent>
      </Card>

      <ResponsiveShell
        open={dialogTipo !== null}
        onClose={() => setDialogTipo(null)}
        title={dialogActivo?.titulo ?? ""}
        description={dialogActivo?.descripcion}
        maxWidth="sm:max-w-lg lg:max-w-6xl xl:max-w-7xl"
      >
        {dialogActivo && (
          <>
            <ModalToolbar
              title={dialogActivo.titulo}
              subtitle={dialogActivo.descripcion}
              saving={false}
              onClose={() => setDialogTipo(null)}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:space-y-3 sm:overflow-y-auto sm:p-4 lg:flex lg:flex-col lg:space-y-0 lg:overflow-hidden lg:p-0">
              {([
                { tipo: "eval1_vencidas",    items: eval1Venc, setter: setEval1Venc, vencida: true,  col: "eval_1_calificacion", vacio: "No hay evaluaciones de 1er mes vencidas" },
                { tipo: "eval1_por_vencer",  items: eval1Prox, setter: setEval1Prox, vencida: false, col: "eval_1_calificacion", vacio: "No hay evaluaciones de 1er mes por vencer" },
                { tipo: "eval2_vencidas",    items: eval2Venc, setter: setEval2Venc, vencida: true,  col: "eval_2_calificacion", vacio: "No hay evaluaciones de 2° mes vencidas" },
                { tipo: "eval2_por_vencer",  items: eval2Prox, setter: setEval2Prox, vencida: false, col: "eval_2_calificacion", vacio: "No hay evaluaciones de 2° mes por vencer" },
                { tipo: "eval3_vencidas",    items: eval3Venc, setter: setEval3Venc, vencida: true,  col: "eval_3_calificacion", vacio: "No hay evaluaciones de 3er mes vencidas" },
                { tipo: "eval3_por_vencer",  items: eval3Prox, setter: setEval3Prox, vencida: false, col: "eval_3_calificacion", vacio: "No hay evaluaciones de 3er mes por vencer" },
              ] as const).map(({ tipo, items, setter, vencida, col, vacio }) =>
                dialogTipo === tipo && (
                  <ListaEvals key={tipo} items={items} vencida={vencida} vacio={vacio}
                    onCalificar={async (dbId, cal) => {
                      await calificarEval(dbId, col, cal)
                      setter(prev => prev.filter(i => i.dbId !== dbId))
                    }}
                  />
                )
              )}

              {dialogTipo === "rg_vencidas" && (
                <ListaFechasPorDepto items={rgVenc} vacio="No hay RG-REC-048 pendientes vencidos"
                  colorAvatar="bg-purple-500"
                  colorBadge="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  colorDias="text-purple-600 dark:text-purple-400"
                  colorBorde="border-purple-400"
                  onEntregado={async (id) => {
                    await marcarRgEntregado(id)
                    setRgVenc(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}
              {dialogTipo === "rg_por_vencer" && (
                <ListaFechasPorDepto items={rgProx} vacio="No hay RG-REC-048 próximos a vencer"
                  colorAvatar="bg-violet-500"
                  colorBadge="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  colorDias="text-violet-600 dark:text-violet-400"
                  colorBorde="border-violet-400"
                  onEntregado={async (id) => {
                    await marcarRgEntregado(id)
                    setRgProx(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}

              {dialogTipo === "termino_vencidos" && (
                <ListaFechasPorDepto items={termVenc} vacio="No hay términos de contrato vencidos"
                  colorAvatar="bg-orange-500"
                  colorBadge="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  colorDias="text-orange-600 dark:text-orange-400"
                  colorBorde="border-orange-400"
                  onIndeterminado={async (id) => {
                    await marcarIndeterminado(id)
                    setTermVenc(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}
              {dialogTipo === "termino_por_vencer" && (
                <ListaFechasPorDepto items={termProx} vacio="No hay términos de contrato próximos a vencer"
                  colorAvatar="bg-blue-500"
                  colorBadge="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  colorDias="text-blue-600 dark:text-blue-400"
                  colorBorde="border-blue-400"
                  onIndeterminado={async (id) => {
                    await marcarIndeterminado(id)
                    setTermProx(prev => prev.filter(i => i.id !== id))
                  }}
                />
              )}

              <div className="shrink-0 border-t px-4 py-3">
                <Link
                  href="/ingresos"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User size={14} />
                  Ver todos en Nuevo Ingreso
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </>
        )}
      </ResponsiveShell>
    </>
  )
}
