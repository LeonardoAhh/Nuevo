"use client"
import { useState, useEffect } from "react"
import { Search, Plus, BookOpen, X, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { downloadExcelReport } from "@/lib/capacitacion/excel"
import type { Course, Position, PositionCourse, Employee, EmployeeCourse } from "@/lib/hooks"

const PAGE_SIZE = 15

interface CapCoursesTabProps {
  courses: Course[]
  loadingCourses: boolean
  isReadOnly: boolean
  positions: Position[]
  positionCourses: PositionCourse[]
  employees: Employee[]
  empCourses: EmployeeCourse[]
  onNewCourse: () => void
}

function courseStatus(calificacion: number | null): { estado: string; clase: string } {
  if (calificacion == null) return { estado: 'pendiente', clase: 'bg-muted text-muted-foreground border' }
  return calificacion >= 70
    ? { estado: 'aprobado',   clase: 'bg-success/15 text-success border border-success/30' }
    : { estado: 'reprobado',  clase: 'bg-destructive/15 text-destructive border border-destructive/30' }
}

export function CapCoursesTab({
  courses, loadingCourses, isReadOnly, positions, positionCourses, employees, empCourses, onNewCourse,
}: CapCoursesTabProps) {
  const [courseSearch, setCourseSearch] = useState("")
  const [coursePage, setCoursePage]     = useState(1)

  const filtered     = courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase()))
  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage     = Math.min(coursePage, totalPages)
  const paginated    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setCoursePage(1) }, [courseSearch])

  const handleExcel = () =>
    downloadExcelReport({ filteredCourses: filtered, positions, positionCourses, employees, empCourses })

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle>Catálogo de cursos</CardTitle>
            <CardDescription>Todos los cursos únicos registrados en el sistema.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              size="icon" variant="outline"
              className="focus-visible:ring-2 focus-visible:ring-ring"
              onClick={handleExcel}
              aria-label="Descargar reporte Excel"
              title="Descargar Excel"
            >
              <Download className="h-4 w-4" />
            </Button>
            {!isReadOnly && (
              <Button size="icon" onClick={onNewCourse} aria-label="Nuevo curso" title="Nuevo curso">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={courseSearch}
            onChange={e => setCourseSearch(e.target.value)}
            className={`pl-9 bg-muted text-foreground ${courseSearch ? "pr-9" : ""}`}
          />
          {courseSearch && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setCourseSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {loadingCourses ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border px-4 py-3 flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {courses.length === 0
              ? "No hay cursos registrados. Importa datos primero."
              : "No se encontraron cursos."}
          </div>
        ) : (
          <>
            {filtered.length > PAGE_SIZE && (
              <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setCoursePage} />
            )}
            <Accordion type="single" collapsible className="w-full space-y-2">
              {paginated.map((course, idx) => {
                const puestosAsignados = positions
                  .filter(pos => positionCourses.some(pc => pc.course_id === course.id && pc.position_id === pos.id))
                  .map(pos => pos.name)

                const empleadosConEstado = employees
                  .filter(emp => puestosAsignados.includes(emp.puesto ?? ''))
                  .map(emp => {
                    const match = empCourses.find(ec => ec.course_id === course.id && ec.employee_id === emp.id)
                    const calificacion = match?.calificacion ?? null
                    const fecha        = match?.fecha_aplicacion ?? null
                    const { estado, clase } = courseStatus(calificacion)
                    return { ...emp, calificacion, fecha, estado, clase }
                  })

                return (
                  <AccordionItem key={course.id} value={course.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                          {(safePage - 1) * PAGE_SIZE + idx + 1}
                        </span>
                        <BookOpen className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground leading-tight flex-1 text-left">{course.name}</span>
                        <Badge variant="secondary" className="bg-muted text-foreground ml-2">
                          {empleadosConEstado.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {empleadosConEstado.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-2">
                          Ningún empleado tiene este curso asignado.
                        </div>
                      ) : (
                        <>
                          {/* Mobile */}
                          <div className="flex flex-col gap-2 sm:hidden">
                            {empleadosConEstado.map((row, i) => (
                              <div key={row.id + '-' + i} className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground flex-1 truncate">{row.nombre}</span>
                                  <Badge className={row.clase}>
                                    {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span><b>Puesto:</b> {row.puesto ?? '—'}</span>
                                  <span><b>Fecha:</b> {row.fecha ? row.fecha.split('-').reverse().join('/') : '—'}</span>
                                  <span><b>Calificación:</b> {row.calificacion != null ? row.calificacion : '—'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Desktop */}
                          <div className="overflow-x-auto hidden sm:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Empleado</TableHead>
                                  <TableHead>Puesto</TableHead>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Calificación</TableHead>
                                  <TableHead>Estado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {empleadosConEstado.map((row, i) => (
                                  <TableRow key={row.id + '-' + i}>
                                    <TableCell>{row.nombre}</TableCell>
                                    <TableCell>{row.puesto ?? '—'}</TableCell>
                                    <TableCell>
                                      {row.fecha ? row.fecha.split('-').reverse().join('/') : '—'}
                                    </TableCell>
                                    <TableCell>
                                      {row.calificacion != null ? (
                                        <Badge variant={row.calificacion >= 70 ? 'default' : 'destructive'}>
                                          {row.calificacion}
                                        </Badge>
                                      ) : '—'}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={row.clase}>
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
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {courses.length} cursos
        </p>
      </CardContent>
    </Card>
  )
}
