"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { DesempenoData } from "@/lib/types/desempeno"

interface Props {
  data: DesempenoData
}

export function DesempenoForm({ data }: Props) {
  return (
    <div className="print:hidden space-y-6">
      {/* Header — full width */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">EVALUACIÓN DE DESEMPEÑO</h1>
              <p className="text-muted-foreground">Personal {data.tipo === 'jefe' ? 'Jefes' : data.tipo === 'administrativo' ? 'Administrativo' : 'Operativo'}</p>
            </div>
            <Badge variant="secondary">{data.periodo}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Número empleado</Label>
              <div className="font-bold text-lg">{data.numero_empleado}</div>
            </div>
            <div>
              <Label>Nombre</Label>
              <div className="font-bold">{data.nombre}</div>
            </div>
            <div>
              <Label>Puesto evaluado</Label>
              <div className="font-bold">{data.puesto}</div>
            </div>
            <div>
              <Label>Evaluador</Label>
              <div>{data.evaluador_nombre || '—'} {data.evaluador_puesto ? `- ${data.evaluador_puesto}` : ''}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout — print stays single column */}
      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
        {/* Left column */}
        <div className="space-y-6">
          {/* Objetivos Table */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos SMART</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Objetivo</th>
                      <th className="text-left p-2">Resultado</th>
                      <th className="text-left p-2">%</th>
                      <th className="text-left p-2">Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.objetivos.map((obj, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="font-medium py-3 px-2">Objetivo {obj.numero}: {obj.descripcion}</td>
                        <td className="px-2 py-3">{obj.resultado}</td>
                        <td className="px-2 py-3">{obj.porcentaje}</td>
                        <td className="px-2 py-3">{obj.comentarios || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Incidencias */}
          {data.incidencias && data.incidencias.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Incidencias recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {data.incidencias.map((inc, idx) => (
                    <div key={idx} className="rounded-lg border border-border p-3">
                      <div className="text-sm font-semibold">{inc.categoria}</div>
                      <div className="text-sm">Mes: {inc.mes || '—'}</div>
                      <div className="text-sm">Valor: {inc.valor ?? 'NA'}</div>
                      <div className="text-sm text-muted-foreground">{inc.notas || 'Sin notas'}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Responsabilidades */}
          <Card>
            <CardHeader>
              <CardTitle>Cumplimiento de responsabilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.cumplimiento_responsabilidades.length > 0 ? (
                data.cumplimiento_responsabilidades.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3">
                    {Object.entries(item).map(([label, value]) => (
                      <div key={label} className="text-sm">
                        <span className="font-semibold">{label}:</span> {value || '—'}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos de responsabilidades.</p>
              )}
            </CardContent>
          </Card>

          {/* Competencias */}
          <Card>
            <CardHeader>
              <CardTitle>Competencias blandas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.competencias.map((competencia, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3">
                    <div className="font-semibold">{competencia.nombre}</div>
                    <div className="text-sm text-muted-foreground mb-2">{competencia.descripcion}</div>
                    <div className="text-sm">Calificación: {competencia.calificacion} / 4</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compromisos */}
          <Card>
            <CardHeader>
              <CardTitle>Compromisos y observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Compromisos / Acuerdos</Label>
                <p>{data.compromisos || '—'}</p>
              </div>
              <div>
                <Label>Fecha de revisión</Label>
                <p>{data.fecha_revision || '—'}</p>
              </div>
              <div>
                <Label>Observaciones</Label>
                <p>{data.observaciones || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Calificación */}
          <Card className="text-center">
            <CardContent className="pt-8">
              <div className="text-4xl font-bold text-primary">{data.calificacion_final}%</div>
              <p className="text-muted-foreground mt-2">Calificación Final</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
