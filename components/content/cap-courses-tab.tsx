"use client"
import { useState, useEffect, useMemo } from "react"
import { Search, Plus, BookOpen, X, Download, Clock, Pencil } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { downloadExcelReport } from "@/lib/capacitacion/excel"
import { CapReportPreviewDialog } from "@/components/content/cap-report-preview-dialog"
import { CapCourseDetailView } from "@/components/content/cap-course-detail-view"
import { getTipoCursoByName } from "@/lib/catalogo"
import { motion, AnimatePresence } from "framer-motion"
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
  onEditCourse: (course: Course) => void
}

function courseStatus(calificacion: number | null): { estado: string; clase: string } {
  if (calificacion == null) return { estado: 'pendiente', clase: 'bg-muted text-muted-foreground border' }
  return calificacion >= 7
    ? { estado: 'aprobado', clase: 'bg-success/15 text-success border border-success/30' }
    : { estado: 'reprobado', clase: 'bg-destructive/15 text-destructive border border-destructive/30' }
}

export function CapCoursesTab({
  courses, loadingCourses, isReadOnly, positions, positionCourses, employees, empCourses, onNewCourse, onEditCourse,
}: CapCoursesTabProps) {
  const [courseSearch, setCourseSearch] = useState("")
  const [coursePage, setCoursePage] = useState(1)

  const filtered = courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(coursePage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setCoursePage(1) }, [courseSearch])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const handleDownload = async () => {
    await downloadExcelReport({ courses, positions, positionCourses, employees, empCourses })
  }

  const selectedCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || null
  }, [courses, selectedCourseId])

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
              variant="outline"
              className="px-3 sm:px-4 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setPreviewOpen(true)}
              aria-label="Descargar reporte Excel"
              title="Descargar Excel"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reporte</span>
            </Button>
            {!isReadOnly && (
              <Button onClick={onNewCourse} className="px-3 sm:px-4" aria-label="Nuevo curso" title="Nuevo curso">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Curso</span>
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
        ) : (
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {selectedCourse ? (
                <CapCourseDetailView
                  key="detail"
                  course={selectedCourse}
                  employees={employees}
                  positions={positions}
                  positionCourses={positionCourses}
                  empCourses={empCourses}
                  onBack={() => setSelectedCourseId(null)}
                  onEdit={onEditCourse}
                  isReadOnly={isReadOnly}
                />
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  {filtered.length === 0 ? (
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
                      {/* Encabezados Desktop */}
                      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_120px_100px_60px_24px] gap-4 px-4 py-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-right pr-1">#</span>
                          <span>Curso</span>
                        </div>
                        <div>Detalles</div>
                        <div className="text-center">Asignados</div>
                        <div className="text-center">Acción</div>
                        <div></div>
                      </div>
                      
                      <div className="w-full space-y-2">
                        {paginated.map((course, idx) => {
                          const puestosAsignados = positions
                            .filter(pos => positionCourses.some(pc => pc.course_id === course.id && pc.position_id === pos.id))
                            .map(pos => pos.name)
                          
                          const asignadosCount = employees.filter(emp => puestosAsignados.includes(emp.puesto ?? '')).length

                          return (
                            <div 
                              key={course.id} 
                              className="border rounded-xl px-2 hover:bg-muted/30 hover:border-border transition-all cursor-pointer group"
                              onClick={() => setSelectedCourseId(course.id)}
                            >
                              <div className="py-3 px-2">
                                <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_120px_100px_60px] w-full gap-4 items-center text-left">
                                  {/* Index & Name */}
                                  <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                                    </span>
                                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium text-foreground leading-tight flex-1 line-clamp-2 pr-2 group-hover:text-primary transition-colors">{course.name}</span>
                                  </div>
                                  
                                  {/* Details */}
                                  <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5 items-center sm:items-start w-full sm:w-auto mt-2 sm:mt-0 pl-9 sm:pl-0">
                                    <Badge variant="outline" className="text-[10px] w-fit">
                                      {course.tipo || getTipoCursoByName(course.name)}
                                    </Badge>
                                    {course.duration_hours != null ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20 w-fit"
                                      >
                                        <Clock className="h-3 w-3" />
                                        {course.duration_hours} h
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] text-muted-foreground border-dashed w-fit"
                                      >
                                        sin duración
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Assignees */}
                                  <div className="hidden sm:flex justify-center items-center">
                                    <Badge variant="secondary" className="bg-muted text-foreground">
                                      {asignadosCount}
                                    </Badge>
                                  </div>

                                  {/* Actions */}
                                  <div className="hidden sm:flex justify-center items-center">
                                    {!isReadOnly && (
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={e => { e.stopPropagation(); onEditCourse(course) }}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault(); e.stopPropagation(); onEditCourse(course)
                                          }
                                        }}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                                        aria-label="Editar curso"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </span>
                                    )}
                                  </div>

                                  {/* Mobile Actions (Visible only on small screens) */}
                                  <div className="flex sm:hidden items-center justify-between w-full mt-2 pl-9">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>Asignados:</span>
                                      <Badge variant="secondary" className="bg-muted text-foreground">
                                        {asignadosCount}
                                      </Badge>
                                    </div>
                                    {!isReadOnly && (
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={e => { e.stopPropagation(); onEditCourse(course) }}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onEditCourse(course) }
                                        }}
                                        className="h-7 w-7 flex items-center justify-center rounded border bg-background text-muted-foreground hover:bg-muted z-10"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    {filtered.length} de {courses.length} cursos
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      <CapReportPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onDownload={handleDownload}
        metrics={{
          totalEmployees: employees.length,
          totalCourses: courses.length,
          totalRecords: empCourses.length
        }}
      />
    </Card>
  )
}
