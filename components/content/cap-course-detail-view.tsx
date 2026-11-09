"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Clock, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTipoCursoByName } from "@/lib/catalogo"
import type { Course, Position, PositionCourse, Employee, EmployeeCourse } from "@/lib/hooks"

function courseStatus(cal: number | null): { estado: string; variant: "secondary" | "success" | "destructive" } {
  if (cal == null) return { estado: 'pendiente', variant: 'secondary' }
  if (cal >= 7) return { estado: 'aprobado', variant: 'success' }
  return { estado: 'reprobado', variant: 'destructive' }
}

interface CapCourseDetailViewProps {
  course: Course
  employees: Employee[]
  positions: Position[]
  positionCourses: PositionCourse[]
  empCourses: EmployeeCourse[]
  onBack: () => void
  onEdit: (course: Course) => void
  isReadOnly?: boolean
}

export function CapCourseDetailView({
  course,
  employees,
  positions,
  positionCourses,
  empCourses,
  onBack,
  onEdit,
  isReadOnly
}: CapCourseDetailViewProps) {
  
  const empleadosConEstado = useMemo(() => {
    const puestosAsignados = positions
      .filter(pos => positionCourses.some(pc => pc.course_id === course.id && pc.position_id === pos.id))
      .map(pos => pos.name)

    return employees
      .filter(emp => puestosAsignados.includes(emp.puesto ?? ''))
      .map(emp => {
        const match = empCourses.find(ec => ec.course_id === course.id && ec.employee_id === emp.id)
        const calificacion = match?.calificacion ?? null
        const fecha = match?.fecha_aplicacion ?? null
        const { estado, variant } = courseStatus(calificacion)
        return { ...emp, calificacion, fecha, estado, variant }
      })
  }, [course.id, employees, positions, positionCourses, empCourses])

  const courseType = course.tipo || getTipoCursoByName(course.name)

  return (
    <motion.div
      key="detail-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col h-full"
    >
      {/* Encabezado del Detalle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-11 w-11 shrink-0 py-0" title="Volver" aria-label="Volver a cursos">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <h2 className="text-xl font-semibold leading-7 tracking-tight">{course.name}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{courseType}</Badge>
                {course.duration_hours != null ? (
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                    <Clock className="h-3 w-3" />
                    {course.duration_hours} h
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-dashed">
                    Sin duración
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        {!isReadOnly && (
          <Button onClick={() => onEdit(course)} variant="ghost" className="h-11 min-h-11 shrink-0 py-0 text-sm font-medium">
            <Pencil className="h-4 w-4 mr-2" />
            Editar curso
          </Button>
        )}
      </div>

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card/50">
          <div className="text-xl font-semibold">{empleadosConEstado.length}</div>
          <div className="text-xs text-muted-foreground">Asignados totales</div>
        </div>
        <div className="p-4 rounded-xl border bg-card/50">
          <div className="text-xl font-semibold text-success">
            {empleadosConEstado.filter(e => e.estado === 'aprobado').length}
          </div>
          <div className="text-xs text-muted-foreground">Aprobados</div>
        </div>
        <div className="p-4 rounded-xl border bg-card/50">
          <div className="text-xl font-semibold text-destructive">
            {empleadosConEstado.filter(e => e.estado === 'reprobado').length}
          </div>
          <div className="text-xs text-muted-foreground">Reprobados</div>
        </div>
        <div className="p-4 rounded-xl border bg-card/50">
          <div className="text-xl font-semibold text-warning">
            {empleadosConEstado.filter(e => e.estado === 'pendiente').length}
          </div>
          <div className="text-xs text-muted-foreground">Pendientes</div>
        </div>
      </div>

      {/* Contenido / Tabla de Empleados */}
      <div>
        <h3 className="mb-4 text-xl font-semibold leading-7 tracking-tight">Empleados asignados</h3>
        {empleadosConEstado.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
            Ningún empleado tiene este curso asignado actualmente.
          </div>
        ) : (
          <>
            {/* Vista Mobile */}
            <div className="flex flex-col gap-3 sm:hidden">
              {empleadosConEstado.map((row) => (
                <div key={row.id} className="rounded-xl border bg-card p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-foreground leading-tight">{row.nombre}</span>
                    <Badge variant={row.variant}>
                      {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
                    <div className="flex justify-between">
                      <span>Puesto:</span>
                      <span className="font-medium text-foreground">{row.puesto ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fecha:</span>
                      <span className="font-medium text-foreground">{row.fecha ? row.fecha.split('-').reverse().join('/') : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calificación:</span>
                      <span className="font-medium text-foreground">{row.calificacion != null ? row.calificacion : '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Vista Desktop */}
            <div className="overflow-hidden border rounded-xl hidden sm:block bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Puesto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleadosConEstado.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.nombre}</TableCell>
                      <TableCell>{row.puesto ?? '—'}</TableCell>
                      <TableCell>
                        {row.fecha ? row.fecha.split('-').reverse().join('/') : '—'}
                      </TableCell>
                      <TableCell>
                        {row.calificacion != null ? (
                          <Badge variant={row.calificacion >= 7 ? 'success' : 'destructive'}>
                            {row.calificacion}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.variant}>
                          {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
