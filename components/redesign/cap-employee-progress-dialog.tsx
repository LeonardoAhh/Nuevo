"use client"

import React from "react"
import {
  BookOpen, CheckCircle2, XCircle, Clock, AlertTriangle,
  Briefcase, ClipboardList, Loader2, Activity
} from "lucide-react"
import styles from "./cap-employee-progress-dialog.module.css"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "./modal-header"
import { RedesignModalFooter } from "./modal-footer"
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
      <RedesignModalHeader
        title={employee?.nombre ?? 'Progreso'}
        icon={<Activity className="h-5 w-5" />}
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
                <div className={`space-y-2 p-4 ${styles.pane}`}>
                  <div className={`flex items-center justify-between text-sm ${styles.displayTitle}`}>
                    <span>
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
                <TabsList className="flex w-full mb-2 bg-muted rounded-md p-1 border-0 shadow-none">
                  <TabsTrigger value="requeridos" className="flex-1 text-sm font-medium rounded-[6px] py-2 data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-sm transition-all text-muted-foreground">
                    <Briefcase className="mr-2 h-[16px] w-[16px]" />
                    Requeridos
                    {progress?.totalRequired ? (
                      <Badge variant="secondary" className="ml-2 text-xs px-1.5 bg-transparent border-border/60 shadow-none font-normal">{progress.totalRequired}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex-1 text-sm font-medium rounded-[6px] py-2 data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-sm transition-all text-muted-foreground">
                    <ClipboardList className="mr-2 h-[16px] w-[16px]" />
                    Historial completo
                    {courses.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs px-1.5 bg-transparent border-border/60 shadow-none font-normal">{courses.length}</Badge>
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
                    <div className={`pb-2 ${styles.cardList}`}>
                      {progress.courses.map((c) => (
                        <div key={c.courseId} className={`flex items-center gap-2.5 p-3 ${styles.pane}
                          ${c.status === 'aprobado' ? 'bg-success/5 border-success/30' : ''}
                          ${c.status === 'reprobado' ? 'bg-destructive/5 border-destructive/30' : ''}
                        `}>
                          {c.status === 'aprobado' && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                          {c.status === 'reprobado' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                          {c.status === 'pendiente' && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm leading-tight truncate ${styles.displayTitle}`}>{c.courseName}</p>
                            </div>
                            {c.fechaAplicacion && (
                              <p className="text-xs text-muted-foreground">{c.fechaAplicacion.split('-').reverse().join('/')}</p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {c.calificacion != null ? (
                              <Badge className={`text-xs font-normal min-w-[2.5rem] justify-center
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
                    <div className={`pb-2 ${styles.cardList}`}>
                      {courses.map((ec, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-3 ${styles.pane}`}>
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm truncate leading-tight ${styles.displayTitle}`}>{ec.course?.name ?? ec.raw_course_name}</p>
                            </div>
                            {ec.fecha_aplicacion && (
                              <p className="text-xs text-muted-foreground">{ec.fecha_aplicacion.split('-').reverse().join('/')}</p>
                            )}
                          </div>
                          {ec.calificacion != null && (
                            <Badge variant={ec.calificacion >= 7 ? "default" : "destructive"} className="shrink-0 text-xs min-w-[2.5rem] justify-center font-normal">
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
      <RedesignModalFooter
        onCancel={onClose}
        cancelLabel="Cerrar"
      />
    </ResponsiveShell>
  )
}
