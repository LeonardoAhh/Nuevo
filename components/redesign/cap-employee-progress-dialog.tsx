"use client"

import {
  AlertTriangle, BadgeCheck, BookOpen, Clock3, History, ListChecks,
  Loader2, OctagonX,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModalFooter, ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"
import { isPassingCourseGrade } from "@/lib/capacitacion/utils"
import type { Employee, EmployeeCourse, EmployeeProgress } from "@/lib/hooks"

export interface CapEmployeeProgressDialogProps {
  employee: Employee | null
  open: boolean
  loading: boolean
  courses: EmployeeCourse[]
  progress: EmployeeProgress | null
  tab: "requeridos" | "historial"
  onTabChange: (tab: "requeridos" | "historial") => void
  onClose: () => void
}

function formatDate(value: string) {
  return value.split("-").reverse().join("/")
}

export function CapEmployeeProgressDialog({
  employee, open, loading, courses, progress, tab, onTabChange, onClose,
}: CapEmployeeProgressDialogProps) {
  const completion = progress?.totalRequired
    ? Math.round((progress.aprobados / progress.totalRequired) * 100)
    : 0

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-xl"
      title="Matriz de capacitación"
      description={employee?.nombre}
    >
      <ModalHeader title="Matriz de capacitación" onClose={onClose} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        {employee && (
          <div className="mb-6 grid gap-5 sm:grid-cols-5 sm:items-center">
            <div className="min-w-0 sm:col-span-3">
              {employee.numero && <p className="mb-1 text-xs text-muted-foreground">Núm. {employee.numero}</p>}
              <p className="break-words text-base font-semibold text-foreground">{employee.nombre}</p>
              {employee.puesto && <p className="mt-1 text-sm text-muted-foreground">{employee.puesto}</p>}
            </div>
            {!loading && progress?.positionFound && progress.totalRequired > 0 && (
              <div className="min-w-0 sm:col-span-2" role="group" aria-label="Avance de cursos requeridos">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{progress.aprobados} de {progress.totalRequired} aprobados</span>
                  <span className="shrink-0 font-medium text-foreground">{completion}%</span>
                </div>
                <div
                  className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Cursos aprobados"
                  aria-valuemin={0}
                  aria-valuemax={progress.totalRequired}
                  aria-valuenow={progress.aprobados}
                  aria-valuetext={`${progress.aprobados} de ${progress.totalRequired} cursos aprobados`}
                >
                  <span className="bg-success" style={{ width: `${completion}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10" role="status" aria-label="Cargando matriz">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={value => onTabChange(value as "requeridos" | "historial")}>
            <TabsList className="flex w-full">
              <TabsTrigger value="requeridos" className="min-w-0 flex-1 gap-2 px-2">
                <ListChecks className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Requeridos</span>
                <span className="text-xs opacity-70">{progress?.totalRequired ?? 0}</span>
              </TabsTrigger>
              <TabsTrigger value="historial" className="min-w-0 flex-1 gap-2 px-2">
                <History className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Historial</span>
                <span className="text-xs opacity-70">{courses.length}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requeridos" className="mt-4 space-y-2">
              {!progress?.positionFound ? (
                <div className="flex gap-3 rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
                  <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
                  <p>Puesto no encontrado en el catálogo. Importa primero el JSON de puestos.</p>
                </div>
              ) : progress.totalRequired === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Este puesto no tiene cursos requeridos.</p>
              ) : (
                progress.courses.map(course => (
                  <div key={course.courseId} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                    {course.status === "aprobado" && <BadgeCheck className="size-4 shrink-0 text-success" aria-hidden="true" />}
                    {course.status === "reprobado" && <OctagonX className="size-4 shrink-0 text-destructive" aria-hidden="true" />}
                    {course.status === "pendiente" && <Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-foreground">{course.courseName}</p>
                      {course.fechaAplicacion && <p className="mt-1 text-xs text-muted-foreground">{formatDate(course.fechaAplicacion)}</p>}
                    </div>
                    {course.calificacion != null && (
                      <Badge variant={course.status === "aprobado" ? "success" : "destructive"} className="shrink-0 font-medium">
                        {course.calificacion}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="historial" className="mt-4 space-y-2">
              {courses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No hay cursos registrados para este empleado.</p>
              ) : (
                courses.map(course => {
                  const grade = course.calificacion
                  const hasGrade = grade != null
                  const passed = grade != null && isPassingCourseGrade(grade)

                  return (
                    <div key={course.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                      {hasGrade ? (
                        passed
                          ? <BadgeCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                          : <OctagonX className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                      ) : <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-foreground">{course.course?.name ?? course.raw_course_name}</p>
                        {course.fecha_aplicacion && <p className="mt-1 text-xs text-muted-foreground">{formatDate(course.fecha_aplicacion)}</p>}
                      </div>
                      {hasGrade && (
                        <Badge variant={passed ? "success" : "destructive"} className="shrink-0 font-medium">
                          {grade}
                        </Badge>
                      )}
                    </div>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ModalFooter onCancel={onClose} cancelLabel="Cerrar" />
    </ResponsiveShell>
  )
}
