"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Download, FileSpreadsheet, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "@/components/redesign/modal-header"
import { RedesignModalFooter } from "@/components/redesign/modal-footer"
import type { Course, Employee, EmployeeCourse } from "@/lib/hooks"
import { getLatestEmployeeCourseAttempts, normalizeCourseName } from "@/lib/hooks/useCapacitacion"

interface CapCourseAuditDialogProps {
  open: boolean
  onOpenChange: (val: boolean) => void
  courses: Course[]
  employees: Employee[]
  empCourses: EmployeeCourse[]
}

function courseStatus(cal: number | null) {
  if (cal == null) return 'pendiente'
  return cal >= 7 ? 'aprobado' : 'reprobado'
}

export function CapCourseAuditDialog({ open, onOpenChange, courses, employees, empCourses }: CapCourseAuditDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [coursePickerOpen, setCoursePickerOpen] = useState(false)
  const [courseSearch, setCourseSearch] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  // Cursos ordenados alfabéticamente para el Select
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.name.localeCompare(b.name))
  }, [courses])

  // Montar cientos de opciones a la vez hacía lento el click del selector.
  // El buscador muestra un máximo de 50 coincidencias por interacción.
  const visibleCourses = useMemo(() => {
    const query = normalizeCourseName(courseSearch)
    const matching = query
      ? sortedCourses.filter(course => normalizeCourseName(course.name).includes(query))
      : sortedCourses
    return matching.slice(0, 50)
  }, [courseSearch, sortedCourses])

  const latestEmpCourses = useMemo(
    () => getLatestEmployeeCourseAttempts(empCourses),
    [empCourses]
  )

  const employeeById = useMemo(
    () => new Map(employees.map(employee => [employee.id, employee])),
    [employees]
  )

  // Una sola fila por empleado: siempre el intento más reciente del curso.
  const auditData = useMemo(() => {
    if (selectedCourseId === "all") return []

    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    if (!selectedCourse) return []

    const courseNorm = normalizeCourseName(selectedCourse.name)

    // Buscamos todas las entradas en empCourses que coincidan con este curso (por id o nombre normalizado)
    const matchingRecords = latestEmpCourses.filter(ec => {
      if (ec.course_id === selectedCourse.id) return true
      const ecNorm = normalizeCourseName(ec.course?.name ?? ec.raw_course_name ?? '')
      if (!ecNorm) return false
      return ecNorm === courseNorm
    })

    // Ahora mapeamos esos registros a empleados reales
    const results = matchingRecords.map(record => {
      const emp = employeeById.get(record.employee_id)
      const calificacion = record.calificacion ?? null
      const fecha = record.fecha_aplicacion ?? null

      return {
        empleadoId: record.employee_id,
        nombre: emp?.nombre || "Empleado Desconocido",
        puesto: emp?.puesto || "—",
        numero: emp?.numero || "—",
        calificacion,
        fecha,
        estado: courseStatus(calificacion),
      }
    })

    // Ordenar alfabéticamente por nombre
    return results.sort((a, b) => a.nombre.localeCompare(b.nombre))

  }, [selectedCourseId, courses, latestEmpCourses, employeeById])

  const selectedCourseName = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId)?.name || ""
  }, [courses, selectedCourseId])

  const handleExport = async () => {
    if (auditData.length === 0) return
    setIsExporting(true)

    try {
      const ExcelJS = await import('exceljs')
      // @ts-expect-error file-saver no incluye declaraciones de tipos en este proyecto
      const { saveAs } = await import('file-saver')
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Auditoría')

      sheet.columns = [
        { header: 'Número empleado', key: 'numero', width: 18 },
        { header: 'Nombre', key: 'nombre', width: 35 },
        { header: 'Puesto', key: 'puesto', width: 30 },
        { header: 'Curso Evaluado', key: 'curso', width: 40 },
        { header: 'Fecha Aplicación', key: 'fecha', width: 18 },
        { header: 'Calificación', key: 'calif', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
      ]

      auditData.forEach(row => {
        sheet.addRow({
          numero: row.numero,
          nombre: row.nombre,
          puesto: row.puesto,
          curso: selectedCourseName,
          fecha: row.fecha ? row.fecha.split('-').reverse().join('/') : '—',
          calif: row.calificacion != null ? String(row.calificacion) : '—',
          estado: row.estado.toUpperCase()
        })
      })

      // Estilos
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Daytona', size: 12 }
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } }
      sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

      const buffer = await workbook.xlsx.writeBuffer()
      const today = new Date().toISOString().slice(0, 10)
      saveAs(new Blob([buffer]), `auditoria-${selectedCourseName.replace(/[^a-zA-Z0-9]/g, '-')}-${today}.xlsx`)
    } catch (e) {
      console.error("Error al exportar:", e)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm:max-w-xl"
      mobileVariant="dialog"
      title="Exportar auditoría"
    >
      <RedesignModalHeader
        title="Exportar auditoría de curso"
        icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
        onClose={() => onOpenChange(false)}
      />

      <div className="overflow-y-auto p-5 sm:p-6 space-y-6 bg-card">
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background border border-border/60">
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">Descarga por curso</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              El archivo incluirá una fila por empleado y conservará únicamente su intento más reciente.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Curso</label>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={coursePickerOpen}
            onClick={() => {
              setCoursePickerOpen(current => !current)
              if (coursePickerOpen) setCourseSearch("")
            }}
            className="h-11 w-full min-w-0 justify-between bg-transparent px-3 text-base font-normal shadow-none"
          >
            <span className="min-w-0 truncate text-left">
              {selectedCourseName || "Selecciona un curso..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {coursePickerOpen && (
            <div className="w-full overflow-hidden rounded-md border border-border/60 bg-card shadow-sm">
              <div className="relative border-b border-border/60 p-2">
                <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={courseSearch}
                  onChange={event => setCourseSearch(event.target.value)}
                  placeholder="Buscar curso..."
                  className="h-9 pl-9 shadow-none"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {visibleCourses.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">No se encontraron cursos.</p>
                ) : (
                  visibleCourses.map(course => (
                    <button
                      key={course.id}
                      type="button"
                      title={course.name}
                      onClick={() => {
                        setSelectedCourseId(course.id)
                        setCoursePickerOpen(false)
                        setCourseSearch("")
                      }}
                      className="flex w-full min-w-0 items-center gap-2 rounded-sm px-3 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                    >
                      <Check className={`h-4 w-4 shrink-0 ${selectedCourseId === course.id ? 'opacity-100' : 'opacity-0'}`} />
                      <span className="min-w-0 flex-1 truncate">{course.name}</span>
                    </button>
                  ))
                )}
                {sortedCourses.length > visibleCourses.length && !courseSearch && (
                  <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                    Escribe para buscar en los {sortedCourses.length.toLocaleString()} cursos.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedCourseId !== "all" && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{selectedCourseName}</p>
                <p className="text-xs text-muted-foreground">Registros únicos listos para exportar</p>
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-ink">
              {auditData.length.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <RedesignModalFooter
        onCancel={() => onOpenChange(false)}
        cancelLabel="Cerrar"
        onConfirm={handleExport}
        saving={isExporting}
        confirmLabel="Descargar Excel"
        confirmIcon={<Download className="h-4 w-4" />}
        confirmDisabled={auditData.length === 0}
      />
    </ResponsiveShell>
  )
}
