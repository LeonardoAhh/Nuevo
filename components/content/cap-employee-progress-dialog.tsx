"use client"

import React from "react"
import {
  BookOpen, CheckCircle2, XCircle, Clock, AlertTriangle,
  Briefcase, ClipboardList, Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import { getTipoCursoByName } from "@/lib/catalogo"
import type { Employee, EmployeeCourse, EmployeeProgress } from "@/lib/hooks"

export interface CapEmployeeProgressDialogProps {
  employee: Employee | null
  open: boolean
  loading: boolean
  courses: EmployeeCourse[]
  progress: EmployeeProgress | null
  tab: 'requeridos' | 'historial'
  onTabChange: (tab: 'requeridos' | 'historial') => void
  onClose: () => void
}

export function CapEmployeeProgressDialog({
  employee, open, loading, courses, progress, tab, onTabChange, onClose,
}: CapEmployeeProgressDialogProps) {
  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-xl" title={employee?.nombre ?? 'Progreso'} description={employee?.puesto ?? ''}>
      <ModalToolbar
        title={employee?.nombre ?? 'Progreso'}
        subtitle={`${employee?.puesto ?? ''}${employee?.departamento ? ` · ${employee.departamento}` : ''}`}
        saving={false}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              {progress?.positionFound && progress.totalRequired > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {progress.aprobados} / {progress.totalRequired} cursos requeridos
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round((progress.aprobados / progress.totalRequired) * 100)}%
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-px">
                    {progress.aprobados > 0 && (
                      <div className="bg-success transition-all" style={{ width: `${(progress.aprobados / progress.totalRequired) * 100}%` }} />
                    )}
                    {progress.reprobados > 0 && (
                      <div className="bg-destructive transition-all" style={{ width: `${(progress.reprobados / progress.totalRequired) * 100}%` }} />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> {progress.aprobados} aprobados</span>
                    <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" /> {progress.reprobados} reprobados</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {progress.pendientes} pendientes</span>
                  </div>
                </div>
              )}

              {progress && !progress.positionFound && (
                <div className="flex items-center gap-2 text-sm text-warning p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Puesto no encontrado en el catálogo. Importa primero el JSON de puestos.
                </div>
              )}

              {/* Tabs */}
              <Tabs value={tab} onValueChange={v => onTabChange(v as any)}>
                <TabsList className="flex w-full">
                  <TabsTrigger value="requeridos" className="flex-1 text-xs sm:text-sm">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                    Requeridos
                    {progress?.totalRequired ? (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 bg-muted">{progress.totalRequired}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex-1 text-xs sm:text-sm">
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    Historial completo
                    {courses.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 bg-muted">{courses.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Required courses */}
                <TabsContent value="requeridos" className="mt-3">
                  {!progress?.positionFound || progress.totalRequired === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      {!progress?.positionFound ? "No se encontró el puesto en el catálogo." : "Este puesto no tiene cursos requeridos registrados."}
                    </p>
                  ) : (
                    <div className="space-y-1.5 pb-2">
                      {progress.courses.map((c) => (
                        <div key={c.courseId} className={`flex items-center gap-2.5 p-2.5 rounded-lg border
                          ${c.status === 'aprobado' ? 'bg-success/10 border-success/30' : ''}
                          ${c.status === 'reprobado' ? 'bg-destructive/10 border-destructive/30' : ''}
                          ${c.status === 'pendiente' ? 'bg-muted/50 border-border' : ''}
                        `}>
                          {c.status === 'aprobado' && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                          {c.status === 'reprobado' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                          {c.status === 'pendiente' && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm leading-tight truncate">{c.courseName}</p>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {c.course?.tipo || getTipoCursoByName(c.courseName)}
                              </Badge>
                            </div>
                            {c.fechaAplicacion && (
                              <p className="text-xs text-muted-foreground">{c.fechaAplicacion.split('-').reverse().join('/')}</p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {c.calificacion != null ? (
                              <Badge className={`text-xs font-bold min-w-[2.5rem] justify-center
                                ${c.status === 'aprobado' ? 'bg-success/15 text-success border border-success/30' : ''}
                                ${c.status === 'reprobado' ? 'bg-destructive/15 text-destructive border border-destructive/30' : ''}
                              `}>{c.calificacion}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground w-16 text-right block">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Full history */}
                <TabsContent value="historial" className="mt-3">
                  {courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No hay cursos registrados para este empleado.</p>
                  ) : (
                    <div className="space-y-1.5 pb-2">
                      {courses.map((ec, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm truncate leading-tight">{ec.course?.name ?? ec.raw_course_name}</p>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {ec.course?.tipo || getTipoCursoByName(ec.course?.name ?? ec.raw_course_name ?? '')}
                              </Badge>
                            </div>
                            {ec.fecha_aplicacion && (
                              <p className="text-xs text-muted-foreground">{ec.fecha_aplicacion.split('-').reverse().join('/')}</p>
                            )}
                          </div>
                          {ec.calificacion != null && (
                            <Badge variant={ec.calificacion >= 70 ? "default" : "destructive"} className="shrink-0 text-xs min-w-[2.5rem] justify-center">
                              {ec.calificacion}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </ResponsiveShell>
  )
}
