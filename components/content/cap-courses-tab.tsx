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
import { CapCourseAuditDialog } from "@/components/content/cap-course-audit-dialog"
import { CapCourseDetailView } from "@/components/content/cap-course-detail-view"
import { getTipoCursoByName } from "@/lib/catalogo"
import { motion, AnimatePresence } from "framer-motion"
import type { Course, Position, PositionCourse, Employee, EmployeeCourse } from "@/lib/hooks"

const PAGE_SIZE = 16

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
  const [auditOpen, setAuditOpen] = useState(false)
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
              className="h-9 px-3 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setAuditOpen(true)}
              aria-label="Auditoría Global"
              title="Auditoría Global"
            >
              Auditoría
            </Button>
            <Button
              variant="outline"
              className="h-9 px-3 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setPreviewOpen(true)}
              aria-label="Descargar reporte Excel"
              title="Descargar Excel"
            >
              Reporte
            </Button>
            {!isReadOnly && (
              <Button onClick={onNewCourse} className="h-9 px-3" aria-label="Nuevo curso" title="Nuevo curso">
                Nuevo curso
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
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {paginated.map((course) => (
                          <div 
                            key={course.id} 
                            className="border rounded-xl px-4 py-3 hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer group flex items-center gap-3"
                            onClick={() => setSelectedCourseId(course.id)}
                          >
                            <BookOpen className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-medium text-foreground leading-tight flex-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {course.name}
                            </span>
                          </div>
                        ))}
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
      
      <CapCourseAuditDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        courses={courses}
        employees={employees}
        empCourses={empCourses}
      />
    </Card>
  )
}
