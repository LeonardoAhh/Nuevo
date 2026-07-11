"use client"

import { useState, useMemo } from "react"
import { Search, Download, Users, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Course, Employee, EmployeeCourse } from "@/lib/hooks"
import { getTipoCursoByName } from "@/lib/catalogo"
import { normalizeCourseName } from "@/lib/hooks/useCapacitacion"

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface CapCourseAuditDialogProps {
  open: boolean
  onOpenChange: (val: boolean) => void
  courses: Course[]
  employees: Employee[]
  empCourses: EmployeeCourse[]
}

function courseStatus(cal: number | null) {
  if (cal == null) return { estado: 'pendiente', clase: 'bg-muted text-muted-foreground' }
  if (cal >= 7) return { estado: 'aprobado', clase: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' }
  return { estado: 'reprobado', clase: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' }
}

export function CapCourseAuditDialog({ open, onOpenChange, courses, employees, empCourses }: CapCourseAuditDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  // Cursos ordenados alfabéticamente para el Select
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.name.localeCompare(b.name))
  }, [courses])

  // Lógica de filtrado de empleados que HAN TOMADO el curso seleccionado
  const auditData = useMemo(() => {
    if (selectedCourseId === "all") return []

    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    if (!selectedCourse) return []

    const courseNorm = normalizeCourseName(selectedCourse.name)

    // Buscamos todas las entradas en empCourses que coincidan con este curso (por id o nombre normalizado)
    const matchingRecords = empCourses.filter(ec => {
      if (ec.course_id === selectedCourse.id) return true
      const ecNorm = normalizeCourseName(ec.course?.name ?? ec.raw_course_name ?? '')
      if (!ecNorm) return false
      if (ecNorm === courseNorm || ecNorm.includes(courseNorm) || courseNorm.includes(ecNorm)) return true
      return false
    })

    // Ahora mapeamos esos registros a empleados reales
    const results = matchingRecords.map(record => {
      const emp = employees.find(e => e.id === record.employee_id)
      const calificacion = record.calificacion ?? null
      const fecha = record.fecha_aplicacion ?? null
      const { estado, clase } = courseStatus(calificacion)

      return {
        empleadoId: record.employee_id,
        nombre: emp?.nombre || "Empleado Desconocido",
        puesto: emp?.puesto || "—",
        numero: emp?.numero || "—",
        calificacion,
        fecha,
        estado,
        clase,
      }
    })

    // Filtro de búsqueda por nombre o puesto
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      return results.filter(r => 
        r.nombre.toLowerCase().includes(q) || 
        r.puesto.toLowerCase().includes(q) ||
        r.numero.toLowerCase().includes(q)
      )
    }

    // Ordenar alfabéticamente por nombre
    return results.sort((a, b) => a.nombre.localeCompare(b.nombre))

  }, [selectedCourseId, courses, empCourses, employees, searchQuery])

  const selectedCourseName = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId)?.name || ""
  }, [courses, selectedCourseId])

  const handleExport = async () => {
    if (auditData.length === 0) return
    setIsExporting(true)
    
    try {
      const ExcelJS = await import('exceljs')
      // @ts-ignore
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        <div className="p-6 border-b flex-shrink-0 bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Auditoría Global de Cursos
            </DialogTitle>
            <DialogDescription>
              Selecciona un curso para ver a todas las personas que lo han tomado en la historia de la empresa, sin importar su puesto actual ni si lo tienen asignado o no.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full h-11 text-base">
                  <SelectValue placeholder="Selecciona el curso a auditar..." />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  <SelectItem value="all" disabled>Selecciona un curso...</SelectItem>
                  {sortedCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCourseId !== "all" && (
              <>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar empleado..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-11"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button 
                  variant="default" 
                  className="h-11 px-6 shadow-sm"
                  onClick={handleExport}
                  disabled={auditData.length === 0 || isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar Excel"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/10 p-6">
          {selectedCourseId === "all" ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-60">
              <Users className="h-16 w-16 mb-4" />
              <p className="text-lg">Selecciona un curso en la parte superior<br/>para comenzar la auditoría.</p>
            </div>
          ) : auditData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-lg font-medium">No hay registros</p>
              <p className="text-sm">Nadie ha tomado este curso (o no coincide con tu búsqueda).</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {auditData.map((row, i) => (
                <div key={row.empleadoId + i} className="flex items-center justify-between p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Left Side: Avatar & Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {getInitials(row.nombre)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate">{row.nombre}</span>
                      <span className="text-sm text-muted-foreground truncate flex items-center gap-2">
                        <span>{row.puesto}</span>
                        <span className="opacity-50">•</span>
                        <span className="font-mono text-xs">#{row.numero}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Status & Grade */}
                  <div className="flex items-center gap-3 flex-shrink-0 pl-4">
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fecha</span>
                      <span className="text-sm">{row.fecha ? row.fecha.split('-').reverse().join('/') : '—'}</span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={row.clase}>
                        {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                      </Badge>
                      {row.calificacion != null && (
                        <div className="text-xs font-mono font-medium text-muted-foreground">
                          Calificación: <span className={row.calificacion >= 7 ? "text-primary" : "text-destructive"}>{row.calificacion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedCourseId !== "all" && (
          <div className="p-4 border-t bg-card text-sm text-muted-foreground flex justify-between items-center">
            <span>Auditando: <strong>{selectedCourseName}</strong></span>
            <span>Total de registros encontrados: <strong>{auditData.length}</strong></span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
