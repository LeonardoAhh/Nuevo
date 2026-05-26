"use client"

import { Building2, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCumplimientoDepartamental } from "@/lib/hooks/useCumplimientoDepartamental"
import { useRole, useUser } from "@/lib/hooks"

export default function CumplimientoDepartamental() {
  const { entregas, loading, periodo, setPeriodo, periodos, toggleEntrega, stats } =
    useCumplimientoDepartamental()
  const { canEdit } = useRole()
  const { user } = useUser()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cumplimiento Departamental
            </CardTitle>
            <CardDescription>
              Entrega de evaluaciones semestrales por departamento
            </CardDescription>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress summary */}
        <div className="flex items-center gap-3">
          <Progress value={stats.porcentaje} className="flex-1" />
          <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
            {stats.entregados}/{stats.total} ({stats.porcentaje}%)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entregas.map((e) => (
              <div
                key={e.departamento}
                className={`flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors ${
                  e.entregado
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {e.entregado ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.departamento}</p>
                    {e.entregado && e.fecha_entrega && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {new Date(e.fecha_entrega).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                        {e.marcado_por ? ` · ${e.marcado_por.split("@")[0]}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={e.entregado ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {e.entregado ? "Entregado" : "Pendiente"}
                  </Badge>

                  {canEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={e.entregado}
                            onCheckedChange={(checked) =>
                              toggleEntrega(e.departamento, checked, user?.email ?? "dev")
                            }
                            className="scale-75"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {e.entregado ? "Marcar como pendiente" : "Marcar como entregado"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
