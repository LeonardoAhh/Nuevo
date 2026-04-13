"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Upload,
  FileJson,
  Search,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  RotateCcw,
  ClipboardList,
  AlertTriangle,
  Clock,
  XCircle,
  Trash2,
  Pencil,
  UserPlus,
  Plus,
  Minus,
  Layers,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useCapacitacion, useRole } from "@/lib/hooks"
import type {
  Department, Position, Course, ImportPreview,
  CourseMatch, HistorialPreview, EmployeeCourse, Employee, EmployeeProgress,
} from "@/lib/hooks"
import { CATALOGO_ORGANIZACIONAL, TURNOS, JEFES_DE_AREA } from "@/lib/catalogo"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { STATUS_META } from "@/lib/constants/status"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CourseMatch['status'] }) {
  const meta = STATUS_META[status]
  const Icon = meta.Icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color} ${meta.bg} ${meta.border}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}

const NEW_COURSE_VALUE = '__new__'

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function CapacitacionContent() {
  const { isReadOnly } = useRole()
  const {
    importing, importError,
    parseJSON, importData,
    fetchDepartments, fetchPositions, fetchCourses, fetchPositionCourses,
    fetchEmployees, fetchEmployeeCourses, fetchEmployeeProgress,
    clearHistorial, deleteEmployee, createEmployeeManual, updateEmployee, addCoursesToEmployee, bulkImportCourseRecords,
  } = useCapacitacion()

  // ── Estado: Importar catálogo ─────────────────────────────────────────────
  const [jsonText, setJsonText] = useState("")
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Estado: Puestos ───────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const [posSearch, setPosSearch] = useState("")
  const [loadingPositions, setLoadingPositions] = useState(false)

  // ── Estado: Cursos ────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([])
  const [courseSearch, setCourseSearch] = useState("")
  const [loadingCourses, setLoadingCourses] = useState(false)

  // ── Estado: Dialog cursos del puesto ─────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [positionCourses, setPositionCourses] = useState<{ course: { name: string }; order_index: number }[]>([])
  const [loadingDialog, setLoadingDialog] = useState(false)

  // ── Estado: Historial – empleados ─────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [progressMap, setProgressMap] = useState<Record<string, { aprobados: number; total: number }>>({})
  const [empSearch, setEmpSearch] = useState("")
  const [empDialogOpen, setEmpDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [empCourses, setEmpCourses] = useState<EmployeeCourse[]>([])
  const [empProgress, setEmpProgress] = useState<EmployeeProgress | null>(null)
  const [loadingEmpCourses, setLoadingEmpCourses] = useState(false)
  const [empDialogTab, setEmpDialogTab] = useState<'requeridos' | 'historial'>('requeridos')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [deleteEmpTarget, setDeleteEmpTarget] = useState<Employee | null>(null)
  const [deletingEmp, setDeletingEmp] = useState(false)
  const [deleteEmpError, setDeleteEmpError] = useState<string | null>(null)

  // ── Estado: Editar empleado dialog ────────────────────────────────────────
  const [editEmpOpen, setEditEmpOpen] = useState(false)
  const [editEmpTarget, setEditEmpTarget] = useState<Employee | null>(null)
  const [editEmpForm, setEditEmpForm] = useState({ numero: '', nombre: '', departamento: '', area: '', puesto: '', turno: '', fecha_ingreso: '', jefe_directo: '' })
  const [editEmpSaving, setEditEmpSaving] = useState(false)
  const [editEmpError, setEditEmpError] = useState<string | null>(null)

  const openEditEmpDlg = (emp: Employee) => {
    setEditEmpTarget(emp)
    setEditEmpForm({
      numero:        emp.numero ?? '',
      nombre:        emp.nombre,
      departamento:  emp.departamento ?? '',
      area:          emp.area ?? '',
      puesto:        emp.puesto ?? '',
      turno:         emp.turno ?? '',
      fecha_ingreso: emp.fecha_ingreso ?? '',
      jefe_directo:  emp.jefe_directo ?? '',
    })
    setEditEmpError(null)
    setEditEmpOpen(true)
  }

  const handleSaveEditEmp = async () => {
    if (!editEmpTarget) return
    if (!editEmpForm.nombre.trim()) { setEditEmpError('El nombre es requerido'); return }
    setEditEmpSaving(true); setEditEmpError(null)
    const result = await updateEmployee(editEmpTarget.id, {
      numero:        editEmpForm.numero.trim() || null,
      nombre:        editEmpForm.nombre.trim(),
      puesto:        editEmpForm.puesto || null,
      departamento:  editEmpForm.departamento || null,
      area:          editEmpForm.area || null,
      turno:         editEmpForm.turno || null,
      fecha_ingreso: editEmpForm.fecha_ingreso || null,
      jefe_directo:  editEmpForm.jefe_directo || null,
    })
    setEditEmpSaving(false)
    if (result.success) {
      setEditEmpOpen(false)
      setEditEmpTarget(null)
      loadEmployees()
      toast.success('Empleado actualizado')
    } else {
      setEditEmpError(result.error ?? 'Error al guardar')
      toast.error(result.error ?? 'Error al actualizar')
    }
  }

  const editEmpAreas   = editEmpForm.departamento ? (CATALOGO_ORGANIZACIONAL[editEmpForm.departamento]?.areas   ?? []) : []
  const editEmpPuestos = editEmpForm.departamento ? (CATALOGO_ORGANIZACIONAL[editEmpForm.departamento]?.puestos ?? []) : []

  // ── Estado: Nuevo empleado dialog ─────────────────────────────────────────
  type NewEmpCourseRow = { course_id: string; course_name: string; fecha_aplicacion: string; calificacion: string }
  const EMPTY_EMP = { numero: '', nombre: '', departamento: '', area: '', puesto: '', turno: '', fecha_ingreso: '', jefe_directo: '' }
  const [newEmpOpen, setNewEmpOpen] = useState(false)
  const [newEmpStep, setNewEmpStep] = useState<1 | 2>(1)
  const [newEmpForm, setNewEmpForm] = useState(EMPTY_EMP)
  const [newEmpCourseRows, setNewEmpCourseRows] = useState<NewEmpCourseRow[]>([])
  const [newEmpSaving, setNewEmpSaving] = useState(false)
  const [newEmpError, setNewEmpError] = useState<string | null>(null)
  const [newEmpSuccess, setNewEmpSuccess] = useState(false)

  const newEmpAreas   = newEmpForm.departamento ? (CATALOGO_ORGANIZACIONAL[newEmpForm.departamento]?.areas   ?? []) : []
  const newEmpPuestos = newEmpForm.departamento ? (CATALOGO_ORGANIZACIONAL[newEmpForm.departamento]?.puestos ?? []) : []

  const resetNewEmp = () => {
    setNewEmpStep(1); setNewEmpForm(EMPTY_EMP); setNewEmpCourseRows([]); setNewEmpError(null)
  }

  const handleNewEmpNext = () => {
    if (!newEmpForm.nombre.trim()) { setNewEmpError('El nombre del empleado es requerido'); return }
    setNewEmpError(null); setNewEmpStep(2)
    if (courses.length === 0) loadCoursesData()
  }

  const handleSaveNewEmp = async () => {
    setNewEmpSaving(true); setNewEmpError(null)
    const result = await createEmployeeManual(
      {
        numero:        newEmpForm.numero.trim() || null,
        nombre:        newEmpForm.nombre.trim(),
        puesto:        newEmpForm.puesto || null,
        departamento:  newEmpForm.departamento || null,
        area:          newEmpForm.area || null,
        turno:         newEmpForm.turno || null,
        fecha_ingreso: newEmpForm.fecha_ingreso || null,
        jefe_directo:  newEmpForm.jefe_directo || null,
      },
      newEmpCourseRows
        .filter(r => r.course_id)
        .map(r => ({
          course_id:        r.course_id,
          course_name:      r.course_name,
          fecha_aplicacion: r.fecha_aplicacion || null,
          calificacion:     r.calificacion ? (parseInt(r.calificacion) || null) : null,
        }))
    )
    setNewEmpSaving(false)
    if (result.success) {
      setNewEmpOpen(false); resetNewEmp(); setNewEmpSuccess(true); setEmpSearch(''); loadEmployees()
      toast.success('Empleado creado')
    } else {
      setNewEmpError(result.error ?? 'Error al guardar')
      toast.error(result.error ?? 'Error al crear empleado')
    }
  }

  const addCourseRow = () =>
    setNewEmpCourseRows(prev => [...prev, { course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])

  const removeCourseRow = (i: number) =>
    setNewEmpCourseRows(prev => prev.filter((_, idx) => idx !== i))

  const updateCourseRow = (i: number, field: keyof NewEmpCourseRow, value: string) =>
    setNewEmpCourseRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      if (field === 'course_id') {
        const course = courses.find(c => c.id === value)
        return { ...r, course_id: value, course_name: course?.name ?? '' }
      }
      return { ...r, [field]: value }
    }))

  // ── Estado: Carga masiva de cursos ────────────────────────────────────────
  type BulkCourseRow = {
    id: number
    numero: string
    employeeId: string | null
    employeeName: string
    cursoRaw: string
    courseId: string | null
    fecha: string
    calificacion: string
  }
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkParseError, setBulkParseError] = useState<string | null>(null)
  const [bulkRows, setBulkRows] = useState<BulkCourseRow[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkSuccess, setBulkSuccess] = useState<number | null>(null)
  const bulkFileRef = useRef<HTMLInputElement>(null)

  // ── Estado: Agregar cursos a empleado existente ────────────────────────────
  const [addCoursesDlgOpen, setAddCoursesDlgOpen] = useState(false)
  const [addCoursesDlgEmp, setAddCoursesDlgEmp] = useState<Employee | null>(null)
  const [addCoursesRows, setAddCoursesRows] = useState<NewEmpCourseRow[]>([{ course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])
  const [addCoursesSaving, setAddCoursesSaving] = useState(false)
  const [addCoursesError, setAddCoursesError] = useState<string | null>(null)
  const [addCoursesSuccess, setAddCoursesSuccess] = useState(false)

  const openAddCoursesDlg = (emp: Employee) => {
    setAddCoursesDlgEmp(emp)
    setAddCoursesRows([{ course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])
    setAddCoursesError(null)
    setAddCoursesDlgOpen(true)
    if (courses.length === 0) loadCoursesData()
  }

  const handleSaveAddCourses = async () => {
    if (!addCoursesDlgEmp) return
    const valid = addCoursesRows.filter(r => r.course_id)
    if (valid.length === 0) { setAddCoursesError('Selecciona al menos un curso'); return }
    setAddCoursesSaving(true); setAddCoursesError(null)
    const result = await addCoursesToEmployee(
      addCoursesDlgEmp.id,
      valid.map(r => ({
        course_id: r.course_id,
        course_name: r.course_name,
        fecha_aplicacion: r.fecha_aplicacion || null,
        calificacion: r.calificacion ? (parseInt(r.calificacion) || null) : null,
      }))
    )
    setAddCoursesSaving(false)
    if (result.success) {
      setAddCoursesDlgOpen(false); setAddCoursesSuccess(true)
    } else {
      setAddCoursesError(result.error ?? 'Error al guardar')
    }
  }

  const addAddCoursesRow = () =>
    setAddCoursesRows(prev => [...prev, { course_id: '', course_name: '', fecha_aplicacion: '', calificacion: '' }])

  const removeAddCoursesRow = (i: number) =>
    setAddCoursesRows(prev => prev.filter((_, idx) => idx !== i))

  const updateAddCoursesRow = (i: number, field: keyof NewEmpCourseRow, value: string) =>
    setAddCoursesRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      if (field === 'course_id') {
        const course = courses.find(c => c.id === value)
        return { ...r, course_id: value, course_name: course?.name ?? '' }
      }
      return { ...r, [field]: value }
    }))

  // ── Handlers: Carga masiva de cursos ─────────────────────────────────────
  const parseBulkJSON = (text: string) => {
    setBulkParseError(null)
    try {
      const parsed = JSON.parse(text)
      const arr: any[] = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) throw new Error('El JSON está vacío')
      const rows: BulkCourseRow[] = arr.map((item, i) => {
        const numero    = String(item.numero ?? item.nn ?? item.NN ?? '').trim()
        const cursoRaw  = String(item.curso ?? item.course ?? item.Curso ?? '').trim()
        const fecha     = String(item.fecha ?? item.date ?? item.Fecha ?? '').trim()
        const calificacion = String(item.calificacion ?? item.Calificacion ?? item.score ?? '').trim()
        const emp    = employees.find(e => (e.numero ?? '') === numero && numero !== '')
        const course = courses.find(c => c.name === cursoRaw)
                    ?? courses.find(c => c.name.toLowerCase() === cursoRaw.toLowerCase())
        return { id: i, numero, employeeId: emp?.id ?? null, employeeName: emp?.nombre ?? '', cursoRaw, courseId: course?.id ?? null, fecha, calificacion }
      })
      setBulkRows(rows)
    } catch (err) {
      setBulkParseError(err instanceof Error ? err.message : 'JSON inválido')
      setBulkRows([])
    }
  }

  const handleBulkParse = () => {
    if (courses.length === 0) loadCoursesData()
    parseBulkJSON(bulkText)
  }

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setBulkText(text)
      setBulkParseError(null)
      setBulkRows([])
    }
    reader.readAsText(file)
    if (bulkFileRef.current) bulkFileRef.current.value = ''
  }

  const updateBulkRow = (id: number, field: 'numero' | 'fecha' | 'calificacion', value: string) => {
    setBulkRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (field === 'numero') {
        const emp = employees.find(e => (e.numero ?? '') === value && value !== '')
        updated.employeeId = emp?.id ?? null
        updated.employeeName = emp?.nombre ?? ''
      }
      return updated
    }))
  }

  const selectBulkRowCourse = (id: number, courseId: string) => {
    setBulkRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const course = courses.find(c => c.id === courseId)
      return { ...r, courseId: courseId || null, cursoRaw: course?.name ?? r.cursoRaw }
    }))
  }

  const handleBulkImport = async () => {
    const valid = bulkRows.filter(r => r.employeeId && r.courseId)
    if (valid.length === 0) { setBulkError('No hay registros válidos con empleado y curso resueltos'); toast.error('No hay registros válidos con empleado y curso resueltos'); return }
    setBulkSaving(true); setBulkError(null)
    const records = valid.map(r => ({
      employee_id:      r.employeeId!,
      course_id:        r.courseId!,
      raw_course_name:  r.cursoRaw,
      fecha_aplicacion: r.fecha || null,
      calificacion:     r.calificacion ? (parseInt(r.calificacion) || null) : null,
    }))
    const result = await bulkImportCourseRecords(records)
    setBulkSaving(false)
    if (result.success) {
      setBulkSuccess(result.inserted)
      setBulkRows([])
      setBulkText('')
      toast.success(`${result.inserted} registros importados correctamente`)
    } else {
      setBulkError(result.error ?? 'Error al importar')
      toast.error(result.error ?? 'Error al importar')
    }
  }

  // ── Handlers: Importar catálogo ───────────────────────────────────────────
  const handleParse = useCallback(() => {
    setParseError(null); setPreview(null); setImportSuccess(false)
    try {
      const parsed = JSON.parse(jsonText)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) throw new Error("El JSON está vacío")
      setPreview(parseJSON(arr))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "JSON inválido")
    }
  }, [jsonText, parseJSON])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonText(text); setParseError(null); setPreview(null); setImportSuccess(false)
      try {
        const parsed = JSON.parse(text)
        setPreview(parseJSON(Array.isArray(parsed) ? parsed : [parsed]))
      } catch { setParseError("No se pudo parsear el archivo JSON") }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImport = async () => {
    if (!preview) return
    const result = await importData(preview)
    if (result.success) {
      setImportSuccess(true); setPreview(null); setJsonText("")
      toast.success('Catálogo importado correctamente')
    } else {
      toast.error(result.error ?? 'Error al importar catálogo')
    }
  }

  const handleReset = () => { setJsonText(""); setPreview(null); setParseError(null); setImportSuccess(false) }

  // ── Handlers: Puestos ─────────────────────────────────────────────────────
  const loadPositionData = useCallback(async () => {
    setLoadingPositions(true)
    try {
      const [depts, pos] = await Promise.all([fetchDepartments(), fetchPositions()])
      setDepartments(depts); setPositions(pos)
    } catch (err) { console.error("Error loading positions:", err) }
    finally { setLoadingPositions(false) }
  }, [])

  useEffect(() => { loadPositionData() }, [loadPositionData])

  const filteredPositions = positions.filter(p => {
    const matchesDept = selectedDept === "all" || p.department_id === selectedDept
    const matchesSearch =
      p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      (p.department as any)?.name?.toLowerCase().includes(posSearch.toLowerCase())
    return matchesDept && matchesSearch
  })

  const handleViewCourses = async (position: Position) => {
    setSelectedPosition(position); setDialogOpen(true); setLoadingDialog(true)
    try { setPositionCourses(await fetchPositionCourses(position.id) as any) }
    catch (err) { console.error("Error loading courses:", err) }
    finally { setLoadingDialog(false) }
  }

  // ── Handlers: Cursos ──────────────────────────────────────────────────────
  const loadCoursesData = useCallback(async () => {
    setLoadingCourses(true)
    try { setCourses(await fetchCourses()) }
    catch (err) { console.error("Error loading courses:", err) }
    finally { setLoadingCourses(false) }
  }, [])

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const handleClearHistorial = async () => {
    const result = await clearHistorial()
    if (result.success) {
      setConfirmClearOpen(false)
      setEmployees([])
      toast.success(`Historial eliminado (${employees.length} empleados)`)
    } else {
      toast.error(result.error ?? 'Error al eliminar historial')
    }
  }

  // ── Handlers: Empleados ───────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    setProgressMap({})
    try {
      const emps = await fetchEmployees()
      setEmployees(emps)
      // Carga progreso en lotes de 8 sin bloquear la UI
      const batchSize = 8
      for (let i = 0; i < emps.length; i += batchSize) {
        const batch = emps.slice(i, i + batchSize)
        const results = await Promise.allSettled(batch.map(e => fetchEmployeeProgress(e)))
        const chunk: Record<string, { aprobados: number; total: number }> = {}
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') {
            chunk[batch[idx].id] = { aprobados: r.value.aprobados, total: r.value.totalRequired }
          }
        })
        setProgressMap(prev => ({ ...prev, ...chunk }))
      }
    } catch (err) { console.error("Error loading employees:", err instanceof Error ? err.message : JSON.stringify(err)) }
    finally { setLoadingEmployees(false) }
  }, [fetchEmployeeProgress])

  const handleViewEmployee = async (emp: Employee) => {
    setSelectedEmployee(emp)
    setEmpDialogOpen(true)
    setLoadingEmpCourses(true)
    setEmpProgress(null)
    setEmpCourses([])
    setEmpDialogTab('requeridos')
    try {
      const [courses, progress] = await Promise.all([
        fetchEmployeeCourses(emp.id),
        fetchEmployeeProgress(emp),
      ])
      setEmpCourses(courses)
      setEmpProgress(progress)
    } catch (err) {
      console.error("Error loading employee data:", err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoadingEmpCourses(false)
    }
  }

  const filteredEmployees = employees
    .filter(e =>
      e.nombre.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.numero ?? '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.departamento ?? '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.puesto ?? '').toLowerCase().includes(empSearch.toLowerCase())
    )
    .sort((a, b) => {
      const na = parseInt(a.numero ?? '0', 10)
      const nb = parseInt(b.numero ?? '0', 10)
      return nb - na
    })

  // ── Grupos de matches ─────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <ReadOnlyBanner />
      <Tabs
        defaultValue="puestos"
        onValueChange={(v) => {
          if (v === "cursos") loadCoursesData()
          if (v === "historial") loadEmployees()
        }}
      >
        <TabsList className="flex w-full mb-4">
          <TabsTrigger value="puestos"  className="flex-1 text-xs sm:text-sm">
            <Briefcase className="mr-1 sm:mr-2 h-4 w-4" /><span>Puestos</span>
          </TabsTrigger>
          <TabsTrigger value="cursos"   className="flex-1 text-xs sm:text-sm">
            <BookOpen className="mr-1 sm:mr-2 h-4 w-4" /><span>Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex-1 text-xs sm:text-sm">
            <ClipboardList className="mr-1 sm:mr-2 h-4 w-4" /><span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="importar" className="hidden">
            <Upload className="mr-1 sm:mr-2 h-4 w-4" /><span>Importar</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: PUESTOS ──────────────────────────────────────────────────── */}
        <TabsContent value="puestos">
          <Card className="bg-card ">
            <CardHeader>
              <CardTitle className="">Puestos registrados</CardTitle>
              <CardDescription className="">
                Consulta los puestos y sus cursos requeridos por departamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder=""
                    value={posSearch} onChange={e => setPosSearch(e.target.value)}
                    className="pl-9 bg-muted  text-foreground"
                  />
                </div>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-full sm:w-56 bg-muted  text-foreground">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className="bg-card ">
                    <SelectItem value="all">Todos los departamentos</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {loadingPositions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredPositions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {positions.length === 0
                    ? "No hay puestos cargados. Usa la pestaña Importar para cargar datos."
                    : "No se encontraron puestos con ese filtro."}
                </div>
              ) : (
                <div className="rounded-xl border  overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className=" bg-background/50">
                        <TableHead className="">Puesto</TableHead>
                        <TableHead className="">Departamento</TableHead>
                        <TableHead className=" text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPositions.map(pos => (
                        <TableRow key={pos.id} className=" hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{pos.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-muted text-foreground">
                              {(pos.department as any)?.name ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 text-foreground dark:hover:bg-gray-700"
                              onClick={() => handleViewCourses(pos)}>
                              Ver cursos <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {filteredPositions.length} de {positions.length} puestos
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: CURSOS ───────────────────────────────────────────────────── */}
        <TabsContent value="cursos">
          <Card className="bg-card ">
            <CardHeader>
              <CardTitle className="">Catálogo de cursos</CardTitle>
              <CardDescription className="">
                Todos los cursos únicos registrados en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder=""
                  value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                  className="pl-9 bg-muted  text-foreground"
                />
              </div>
              {loadingCourses ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {courses.length === 0 ? "No hay cursos registrados. Importa datos primero." : "No se encontraron cursos."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCourses.map((course, idx) => (
                    <div key={course.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground leading-tight">{course.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {filteredCourses.length} de {courses.length} cursos
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: HISTORIAL ────────────────────────────────────────────────── */}
        <TabsContent value="historial">
          <div className="space-y-4">

            {/* Alertas de éxito */}
            {(newEmpSuccess || addCoursesSuccess) && (
              <Alert className="border-success/30 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  {newEmpSuccess ? 'Empleado registrado correctamente.' : 'Cursos guardados correctamente.'}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Lista de empleados ────────────────────────────────────────── */}
            <Card className="bg-card ">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="">Empleados</CardTitle>
                    <CardDescription className="">
                      Registro de cursos tomados por empleado.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmClearOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" /> Borrar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setBulkSuccess(null); setBulkError(null); setBulkParseError(null)
                        setBulkRows([]); setBulkText(''); setBulkOpen(true)
                        if (courses.length === 0) loadCoursesData()
                      }}
                    >
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Carga masiva</span>
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setNewEmpSuccess(false); resetNewEmp(); setNewEmpOpen(true) }}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nuevo empleado</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                    className="pl-9 bg-muted  text-foreground"
                  />
                </div>
                {loadingEmployees ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {employees.length === 0
                      ? "Sin empleados registrados. Usa el botón \"Nuevo empleado\" para agregar."
                      : "No se encontraron empleados con esa búsqueda."}
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/50">
                          <TableHead className="w-14 hidden sm:table-cell">N.N.</TableHead>
                          <TableHead>Empleado</TableHead>
                          <TableHead className="hidden sm:table-cell">Puesto</TableHead>
                          <TableHead className="hidden md:table-cell">Departamento</TableHead>
                          <TableHead className="hidden sm:table-cell w-28">Avance</TableHead>
                          <TableHead className="text-right w-28 sm:w-auto">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map(emp => (
                          <TableRow key={emp.id} className="hover:bg-muted/50">
                            <TableCell className="text-sm text-muted-foreground font-mono hidden sm:table-cell">{emp.numero ?? "—"}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              <div className="flex flex-col">
                                <span>{emp.nombre}</span>
                                <span className="text-xs text-muted-foreground font-mono sm:hidden">{emp.numero ?? ""}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">{emp.puesto ?? "—"}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {emp.departamento && (
                                <Badge variant="secondary" className="bg-muted text-foreground text-xs">
                                  {emp.departamento}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell w-28">
                              {progressMap[emp.id] != null && (
                                <Progress
                                  value={progressMap[emp.id].total > 0 ? Math.round((progressMap[emp.id].aprobados / progressMap[emp.id].total) * 100) : 0}
                                  className="h-1.5"
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-right p-2">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 sm:w-auto sm:px-2 sm:gap-1 text-foreground"
                                  onClick={() => openAddCoursesDlg(emp)}
                                  title="Agregar cursos"
                                >
                                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                  <span className="hidden sm:inline text-xs">+Curso</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-foreground"
                                  onClick={() => openEditEmpDlg(emp)}
                                  title="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 sm:w-auto sm:px-2 sm:gap-1 text-foreground"
                                  onClick={() => handleViewEmployee(emp)}
                                  title="Ver detalle"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => { setDeleteEmpError(null); setDeleteEmpTarget(emp) }}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {filteredEmployees.length} de {employees.length} empleados
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: IMPORTAR CATÁLOGO ────────────────────────────────────────── */}
        <TabsContent value="importar">
          <div className="space-y-4">
            {importSuccess && (
              <Alert className="border-success/30 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Catálogo importado correctamente a Supabase.
                </AlertDescription>
              </Alert>
            )}
            {(parseError || importError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError || importError}</AlertDescription>
              </Alert>
            )}

            <Card className="bg-card ">
              <CardHeader>
                <CardTitle className="">Cargar catálogo JSON</CardTitle>
                <CardDescription className="">
                  Estructura con{" "}
                  <code className="text-xs bg-gray-100 bg-muted px-1 rounded">position</code>,{" "}
                  <code className="text-xs bg-gray-100 bg-muted px-1 rounded">department</code> y{" "}
                  <code className="text-xs bg-gray-100 bg-muted px-1 rounded">requiredCourses_*</code>.
                  Los campos vacíos se ignorarán automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed  rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Arrastra un archivo JSON o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Solo archivos .json</p>
                  <input ref={fileInputRef} type="file" accept=".json,application/json"
                    onChange={handleFileUpload} className="hidden" />
                </div>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1 bg-muted" />
                  <span className="text-xs text-muted-foreground">o pega el JSON</span>
                  <Separator className="flex-1 bg-muted" />
                </div>

                <textarea
                  value={jsonText}
                  onChange={e => { setJsonText(e.target.value); setPreview(null); setParseError(null) }}
                  placeholder='[{ "position": "...", "department": "...", "requiredCourses_1": "..." }]'
                  rows={8}
                  className="w-full rounded-xl border  bg-muted text-foreground p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-2 justify-end">
                  {(jsonText || preview || importSuccess) && (
                    <Button variant="outline" onClick={handleReset} className="gap-2  text-foreground">
                      <RotateCcw className="h-4 w-4" /> Limpiar
                    </Button>
                  )}
                  <Button onClick={handleParse} disabled={!jsonText.trim()} className="gap-2">
                    <Search className="h-4 w-4" /> Analizar JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            {preview && (
              <Card className="bg-card ">
                <CardHeader>
                  <CardTitle className=" flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Vista previa de importación
                  </CardTitle>
                  <CardDescription className="">
                    Revisa los datos antes de confirmar. Se usará upsert: no se duplicarán registros existentes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Registros JSON", value: preview.totalRecords, Icon: FileJson },
                      { label: "Departamentos",  value: preview.departments.length, Icon: Building2 },
                      { label: "Puestos",        value: preview.positions.length,   Icon: Briefcase },
                      { label: "Cursos únicos",  value: preview.courses.length,     Icon: BookOpen },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="rounded-lg border  p-3 text-center">
                        <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xl font-bold ">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Departamentos detectados</p>
                    <div className="flex flex-wrap gap-2">
                      {preview.departments.map(d => (
                        <Badge key={d} variant="secondary" className="bg-muted text-foreground">{d}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Puestos (mostrando {Math.min(5, preview.positions.length)} de {preview.positions.length})
                    </p>
                    <div className="rounded-xl border  overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className=" bg-background/50">
                            <TableHead className="">Puesto</TableHead>
                            <TableHead className="">Departamento</TableHead>
                            <TableHead className=" text-right">Cursos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.positions.slice(0, 5).map((pos, i) => (
                            <TableRow key={i} className="">
                              <TableCell className="font-medium text-foreground text-sm">{pos.name}</TableCell>
                              <TableCell className=" text-sm">{pos.department}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className=" text-foreground">{pos.courses.length}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleImport} disabled={isReadOnly || importing} className="gap-2">
                      {importing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Confirmar e importar</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Agregar cursos a empleado ────────────────────────────── */}
      <Dialog open={addCoursesDlgOpen} onOpenChange={open => { if (!open) { setAddCoursesError(null); setAddCoursesDlgOpen(open) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Agregar cursos
            </DialogTitle>
            <DialogDescription>
              {addCoursesDlgEmp?.nombre}
              {addCoursesDlgEmp?.puesto ? ` · ${addCoursesDlgEmp.puesto}` : ''}
            </DialogDescription>
          </DialogHeader>

          {addCoursesError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{addCoursesError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 overflow-y-auto">
            {loadingCourses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {addCoursesRows.map((row, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border bg-muted/50">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Curso</label>
                          <Select value={row.course_id} onValueChange={v => updateAddCoursesRow(i, 'course_id', v)}>
                            <SelectTrigger className="bg-muted  text-foreground text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card  max-h-60">
                              {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {addCoursesRows.length > 1 && (
                          <button
                            onClick={() => removeAddCoursesRow(i)}
                            className="mt-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Fecha aplicación</label>
                          <Input type="date"
                            value={row.fecha_aplicacion}
                            onChange={e => updateAddCoursesRow(i, 'fecha_aplicacion', e.target.value)}
                            className="bg-muted text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Calificación</label>
                          <Input type="number" min="0" max="100"
                            value={row.calificacion}
                            onChange={e => updateAddCoursesRow(i, 'calificacion', e.target.value)}
                            className="text-sm bg-muted  text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addAddCoursesRow}
                  className="w-full gap-2  text-foreground">
                  <Plus className="h-4 w-4" /> Agregar otro curso
                </Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCoursesDlgOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAddCourses} disabled={isReadOnly || addCoursesSaving} className="gap-2">
              {addCoursesSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : 'Guardar cursos'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Carga masiva de cursos ───────────────────────────────── */}
      <Dialog open={bulkOpen} onOpenChange={open => { if (!open) { setBulkRows([]); setBulkError(null); setBulkParseError(null) } setBulkOpen(open) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Carga masiva de cursos
            </DialogTitle>
            <DialogDescription>
              Importa cursos tomados por múltiples empleados desde un archivo JSON.
            </DialogDescription>
          </DialogHeader>

          {bulkSuccess !== null && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                {bulkSuccess} registros importados correctamente.
              </AlertDescription>
            </Alert>
          )}

          {bulkError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{bulkError}</AlertDescription>
            </Alert>
          )}

          {/* ── Fase 1: Entrada JSON ──────────────────────────────────────── */}
          {bulkRows.length === 0 && bulkSuccess === null && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Formato esperado:</p>
                <pre className="text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">{`[
  { "numero": "1234", "curso": "Seguridad Industrial", "fecha": "2025-03-15", "calificacion": 85 },
  { "numero": "5678", "curso": "Calidad Total", "fecha": "2025-04-01" }
]`}</pre>
              </div>

              {bulkParseError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{bulkParseError}</AlertDescription>
                </Alert>
              )}

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => bulkFileRef.current?.click()}
              >
                <FileJson className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Haz clic para seleccionar un archivo JSON</p>
                <p className="text-xs text-muted-foreground mt-1">Solo archivos .json</p>
                <input ref={bulkFileRef} type="file" accept=".json,application/json" onChange={handleBulkFile} className="hidden" />
              </div>

              <div className="flex items-center gap-3">
                <Separator className="flex-1 bg-muted" />
                <span className="text-xs text-muted-foreground">o pega el JSON</span>
                <Separator className="flex-1 bg-muted" />
              </div>

              <textarea
                value={bulkText}
                onChange={e => { setBulkText(e.target.value); setBulkParseError(null) }}
                placeholder='[{ "numero": "1234", "curso": "...", "fecha": "2025-01-01", "calificacion": 90 }]'
                rows={6}
                className="w-full rounded-xl border bg-muted text-foreground p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="flex justify-end">
                <Button onClick={handleBulkParse} disabled={!bulkText.trim()} className="gap-2">
                  <Search className="h-4 w-4" /> Previsualizar
                </Button>
              </div>
            </div>
          )}

          {/* ── Fase 2: Preview editable ──────────────────────────────────── */}
          {bulkRows.length > 0 && (() => {
            const validCount = bulkRows.filter(r => r.employeeId && r.courseId).length
            const invalidCount = bulkRows.length - validCount
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="text-muted-foreground">{bulkRows.length} registros</span>
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {validCount} válidos
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-warning font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> {invalidCount} con errores
                    </span>
                  )}
                </div>

                <div className="rounded-xl border overflow-hidden">
                  <div className="overflow-y-auto max-h-72">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/50 sticky top-0 z-10">
                          <TableHead className="w-20">N.N.</TableHead>
                          <TableHead>Empleado</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead className="w-32">Fecha</TableHead>
                          <TableHead className="w-20">Cal.</TableHead>
                          <TableHead className="w-8 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkRows.map(row => {
                          const isOk = !!(row.employeeId && row.courseId)
                          const noEmp = !row.employeeId
                          return (
                            <TableRow key={row.id} className={isOk ? '' : 'bg-warning/5'}>
                              <TableCell className="p-1.5">
                                <Input
                                  value={row.numero}
                                  onChange={e => updateBulkRow(row.id, 'numero', e.target.value)}
                                  className="h-8 font-mono text-xs bg-muted text-foreground"
                                />
                              </TableCell>
                              <TableCell className="p-1.5 max-w-[140px]">
                                <span className={`text-xs leading-tight block truncate ${noEmp ? 'text-destructive font-medium' : 'text-foreground'}`}>
                                  {noEmp
                                    ? (row.numero ? `"${row.numero}" no encontrado` : 'Sin número')
                                    : row.employeeName}
                                </span>
                              </TableCell>
                              <TableCell className="p-1.5 min-w-[160px]">
                                <Select value={row.courseId ?? ''} onValueChange={v => selectBulkRowCourse(row.id, v)}>
                                  <SelectTrigger className="h-8 text-xs bg-muted text-foreground">
                                    <SelectValue placeholder={row.cursoRaw || 'Selecciona curso'} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card max-h-48">
                                    {courses.map(c => (
                                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!row.courseId && row.cursoRaw && (
                                  <p className="text-xs text-warning mt-0.5 truncate" title={row.cursoRaw}>{row.cursoRaw}</p>
                                )}
                              </TableCell>
                              <TableCell className="p-1.5">
                                <Input
                                  type="date"
                                  value={row.fecha}
                                  onChange={e => updateBulkRow(row.id, 'fecha', e.target.value)}
                                  className="h-8 text-xs bg-muted text-foreground"
                                />
                              </TableCell>
                              <TableCell className="p-1.5">
                                <Input
                                  type="number" min="0" max="100"
                                  value={row.calificacion}
                                  onChange={e => updateBulkRow(row.id, 'calificacion', e.target.value)}
                                  className="h-8 text-xs bg-muted text-foreground"
                                />
                              </TableCell>
                              <TableCell className="p-1.5 text-center">
                                {isOk
                                  ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                                  : <AlertTriangle className="h-4 w-4 text-warning mx-auto" />}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <button
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                  onClick={() => { setBulkRows([]); setBulkError(null) }}
                >
                  ← Volver a editar JSON
                </button>
              </div>
            )
          })()}

          {(bulkRows.length > 0 || bulkSuccess !== null) && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                {bulkSuccess !== null ? 'Cerrar' : 'Cancelar'}
              </Button>
              {bulkRows.length > 0 && (() => {
                const validCount = bulkRows.filter(r => r.employeeId && r.courseId).length
                return (
                  <Button
                    onClick={handleBulkImport}
                    disabled={isReadOnly || bulkSaving || validCount === 0}
                    className="gap-2"
                  >
                    {bulkSaving
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</>
                      : <><Upload className="h-4 w-4" /> Importar {validCount} registros</>
                    }
                  </Button>
                )
              })()}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nuevo Empleado ───────────────────────────────────────── */}
      <Dialog open={newEmpOpen} onOpenChange={open => { if (!open) resetNewEmp(); setNewEmpOpen(open) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nuevo empleado
            </DialogTitle>
            <DialogDescription>
              Paso {newEmpStep} de 2 — {newEmpStep === 1 ? 'Datos del empleado' : 'Cursos tomados (opcional)'}
            </DialogDescription>
          </DialogHeader>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${newEmpStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${newEmpStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {newEmpError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{newEmpError}</AlertDescription>
            </Alert>
          )}

          {/* ── Paso 1: Datos ─────────────────────────────────────────────── */}
          {newEmpStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">N.N</label>
                  <Input
                    value={newEmpForm.numero}
                    onChange={e => setNewEmpForm(f => ({ ...f, numero: e.target.value }))}
                    className="bg-muted  text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Fecha de ingreso</label>
                  <Input type="date"
                    value={newEmpForm.fecha_ingreso}
                    onChange={e => setNewEmpForm(f => ({ ...f, fecha_ingreso: e.target.value }))}
                    className="bg-muted text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nombre completo <span className="text-destructive">*</span></label>
                <Input
                  value={newEmpForm.nombre}
                  onChange={e => setNewEmpForm(f => ({ ...f, nombre: e.target.value }))}
                  className="bg-muted  text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                <Select
                  value={newEmpForm.departamento}
                  onValueChange={v => setNewEmpForm(f => ({ ...f, departamento: v, area: '', puesto: '' }))}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card  max-h-60">
                    {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Área</label>
                  <Select
                    value={newEmpForm.area}
                    onValueChange={v => setNewEmpForm(f => ({ ...f, area: v }))}
                    disabled={newEmpAreas.length === 0}
                  >
                    <SelectTrigger className="bg-muted  text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card  max-h-60">
                      {newEmpAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Turno</label>
                  <Select
                    value={newEmpForm.turno}
                    onValueChange={v => setNewEmpForm(f => ({ ...f, turno: v }))}
                  >
                    <SelectTrigger className="bg-muted  text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card ">
                      {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Puesto</label>
                <Select
                  value={newEmpForm.puesto}
                  onValueChange={v => setNewEmpForm(f => ({ ...f, puesto: v }))}
                  disabled={newEmpPuestos.length === 0}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card  max-h-60">
                    {newEmpPuestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Jefe directo</label>
                <Select
                  value={newEmpForm.jefe_directo}
                  onValueChange={v => setNewEmpForm(f => ({ ...f, jefe_directo: v }))}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card  max-h-60">
                    {JEFES_DE_AREA.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Paso 2: Cursos ────────────────────────────────────────────── */}
          {newEmpStep === 2 && (
            <div className="space-y-3 overflow-y-auto max-h-[60dvh] pr-1">
              {loadingCourses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {newEmpCourseRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin cursos agregados. Puedes guardar así o agregar cursos tomados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {newEmpCourseRows.map((row, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border bg-muted/50">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Curso</label>
                              <Select
                                value={row.course_id}
                                onValueChange={v => updateCourseRow(i, 'course_id', v)}
                              >
                                <SelectTrigger className="bg-muted  text-foreground text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card  max-h-60">
                                  {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <button
                              onClick={() => removeCourseRow(i)}
                              className="mt-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Fecha aplicación</label>
                              <Input type="date"
                                value={row.fecha_aplicacion}
                                onChange={e => updateCourseRow(i, 'fecha_aplicacion', e.target.value)}
                                className="bg-muted text-foreground"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Calificación</label>
                              <Input type="number" min="0" max="100"
                                value={row.calificacion}
                                onChange={e => updateCourseRow(i, 'calificacion', e.target.value)}
                                className="text-sm bg-muted  text-foreground"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={addCourseRow}
                    className="w-full gap-2  text-foreground">
                    <Plus className="h-4 w-4" /> Agregar curso
                  </Button>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {newEmpStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => { resetNewEmp(); setNewEmpOpen(false) }}>
                  Cancelar
                </Button>
                <Button onClick={handleNewEmpNext}>
                  Siguiente →
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setNewEmpStep(1)}>
                  ← Anterior
                </Button>
                <Button onClick={handleSaveNewEmp} disabled={isReadOnly || newEmpSaving} className="gap-2">
                  {newEmpSaving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                    : 'Guardar'
                  }
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmación borrar historial ─────────────────────────── */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Borrar historial
            </DialogTitle>
            <DialogDescription>
              Se eliminarán <strong>{employees.length} empleados</strong> y
              todos sus registros de cursos tomados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmClearOpen(false)}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistorial}
              disabled={isReadOnly || importing}
              className="gap-2"
            >
              {importing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Borrando...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Sí, borrar todo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar Empleado ──────────────────────────────────────── */}
      <Dialog open={editEmpOpen} onOpenChange={open => { if (!open) { setEditEmpOpen(false); setEditEmpTarget(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar empleado
            </DialogTitle>
            <DialogDescription>
              Modifica los datos de <strong>{editEmpTarget?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          {editEmpError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{editEmpError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">N.N</label>
                <Input
                  value={editEmpForm.numero}
                  onChange={e => setEditEmpForm(f => ({ ...f, numero: e.target.value }))}
                  className="bg-muted  text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fecha de ingreso</label>
                <Input type="date"
                  value={editEmpForm.fecha_ingreso}
                  onChange={e => setEditEmpForm(f => ({ ...f, fecha_ingreso: e.target.value }))}
                  className="bg-muted text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nombre completo <span className="text-destructive">*</span></label>
              <Input
                value={editEmpForm.nombre}
                onChange={e => setEditEmpForm(f => ({ ...f, nombre: e.target.value }))}
                className="bg-muted  text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                <Select
                  value={editEmpForm.departamento}
                  onValueChange={v => setEditEmpForm(f => ({ ...f, departamento: v, area: '', puesto: '' }))}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card  max-h-60">
                    {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Área</label>
                <Select
                  value={editEmpForm.area}
                  onValueChange={v => setEditEmpForm(f => ({ ...f, area: v }))}
                  disabled={editEmpAreas.length === 0}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card  max-h-60">
                    {editEmpAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Puesto</label>
              <Select
                value={editEmpForm.puesto}
                onValueChange={v => setEditEmpForm(f => ({ ...f, puesto: v }))}
                disabled={editEmpPuestos.length === 0}
              >
                <SelectTrigger className="bg-muted  text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card  max-h-60">
                  {editEmpPuestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Turno</label>
                <Select
                  value={editEmpForm.turno}
                  onValueChange={v => setEditEmpForm(f => ({ ...f, turno: v }))}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card ">
                    {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Jefe directo</label>
                <Select
                  value={editEmpForm.jefe_directo}
                  onValueChange={v => setEditEmpForm(f => ({ ...f, jefe_directo: v }))}
                >
                  <SelectTrigger className="bg-muted  text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card  max-h-60">
                    {JEFES_DE_AREA.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setEditEmpOpen(false); setEditEmpTarget(null) }}
              disabled={editEmpSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEditEmp} disabled={isReadOnly || editEmpSaving} className="gap-2">
              {editEmpSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : <><Pencil className="h-4 w-4" /> Guardar cambios</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar borrar empleado individual ────────────────────────── */}
      <Dialog open={!!deleteEmpTarget} onOpenChange={(o) => { if (!o) setDeleteEmpTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Eliminar empleado
            </DialogTitle>
            <DialogDescription>
              Se eliminará a <strong>{deleteEmpTarget?.nombre}</strong> y
              todos sus datos del sistema: cursos, evaluaciones de desempeño, datos de promoción y nuevo ingreso.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteEmpError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{deleteEmpError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteEmpTarget(null)}
              disabled={deletingEmp}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isReadOnly || deletingEmp}
              className="gap-2"
              onClick={async () => {
                if (!deleteEmpTarget) return
                setDeletingEmp(true)
                setDeleteEmpError(null)
                const result = await deleteEmployee(deleteEmpTarget.id, deleteEmpTarget.numero)
                setDeletingEmp(false)
                if (result.success) {
                  setEmployees(prev => prev.filter(e => e.id !== deleteEmpTarget.id))
                  setDeleteEmpTarget(null)
                  toast.success('Empleado eliminado')
                } else {
                  setDeleteEmpError(result.error ?? 'Error al eliminar')
                  toast.error(result.error ?? 'Error al eliminar')
                }
              }}
            >
              {deletingEmp ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Sí, eliminar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Cursos requeridos del puesto ──────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPosition?.name}</DialogTitle>
            <DialogDescription>
              {(selectedPosition?.department as any)?.name} · Cursos requeridos
            </DialogDescription>
          </DialogHeader>
              {loadingDialog ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
          ) : positionCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay cursos registrados para este puesto.
            </p>
          ) : (
            <div className="space-y-2">
              {positionCourses.map((pc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border">
                  <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">{pc.order_index}</span>
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{pc.course.name}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Progreso del empleado ─────────────────────────────────── */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.nombre}</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.puesto}{selectedEmployee?.departamento ? ` · ${selectedEmployee.departamento}` : ''}
            </DialogDescription>
          </DialogHeader>

              {loadingEmpCourses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de progreso y resumen (solo si hay puesto en catálogo) */}
              {empProgress?.positionFound && empProgress.totalRequired > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {empProgress.aprobados} / {empProgress.totalRequired} cursos requeridos
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round((empProgress.aprobados / empProgress.totalRequired) * 100)}%
                    </span>
                  </div>
                  {/* Barra segmentada */}
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-px">
                    {empProgress.aprobados > 0 && (
                      <div
                        className="bg-success transition-all"
                        style={{ width: `${(empProgress.aprobados / empProgress.totalRequired) * 100}%` }}
                      />
                    )}
                    {empProgress.reprobados > 0 && (
                      <div
                        className="bg-destructive transition-all"
                        style={{ width: `${(empProgress.reprobados / empProgress.totalRequired) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" /> {empProgress.aprobados} aprobados
                    </span>
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3" /> {empProgress.reprobados} reprobados
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {empProgress.pendientes} pendientes
                    </span>
                  </div>
                </div>
              )}

              {empProgress && !empProgress.positionFound && (
                <div className="flex items-center gap-2 text-sm text-warning p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Puesto no encontrado en el catálogo. Importa primero el JSON de puestos.
                </div>
              )}

              {/* Tabs Requeridos / Historial */}
              <Tabs value={empDialogTab} onValueChange={v => setEmpDialogTab(v as any)}>
                <TabsList className="flex w-full">
                  <TabsTrigger value="requeridos" className="flex-1 text-xs sm:text-sm">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                    Requeridos
                    {empProgress?.totalRequired ? (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 bg-muted">
                        {empProgress.totalRequired}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex-1 text-xs sm:text-sm">
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    Historial completo
                    {empCourses.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 bg-muted">
                        {empCourses.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── Requeridos ───────────────────────────────────────── */}
                <TabsContent value="requeridos" className="mt-3">
                  {!empProgress?.positionFound || empProgress.totalRequired === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      {!empProgress?.positionFound
                        ? "No se encontró el puesto en el catálogo."
                        : "Este puesto no tiene cursos requeridos registrados."}
                    </p>
                  ) : (
                    <div className="space-y-1.5 pb-2">
                      {empProgress.courses.map((c) => (
                        <div
                          key={c.courseId}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border
                            ${c.status === 'aprobado'  ? 'bg-success/10 border-success/30' : ''}
                            ${c.status === 'reprobado' ? 'bg-destructive/10 border-destructive/30'   : ''}
                            ${c.status === 'pendiente' ? 'bg-muted/50 border-border'  : ''}
                          `}
                        >
                          {c.status === 'aprobado'  && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                          {c.status === 'reprobado' && <XCircle      className="h-4 w-4 text-destructive   shrink-0" />}
                          {c.status === 'pendiente' && <Clock        className="h-4 w-4 text-muted-foreground    shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-tight truncate">{c.courseName}</p>
                            {c.fechaAplicacion && (
                              <p className="text-xs text-muted-foreground">
                                {c.fechaAplicacion.split('-').reverse().join('/')}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {c.calificacion != null ? (
                              <Badge
                                className={`text-xs font-bold min-w-[2.5rem] justify-center
                                  ${c.status === 'aprobado'  ? 'bg-success/15 text-success border border-success/30' : ''}
                                  ${c.status === 'reprobado' ? 'bg-destructive/15 text-destructive border border-destructive/30' : ''}
                                `}
                              >
                                {c.calificacion}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground w-16 text-right block">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── Historial completo ───────────────────────────────── */}
                <TabsContent value="historial" className="mt-3">
                  {empCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No hay cursos registrados para este empleado.
                    </p>
                  ) : (
                    <div className="space-y-1.5 pb-2">
                      {empCourses.map((ec, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate leading-tight">
                              {ec.course?.name ?? ec.raw_course_name}
                            </p>
                            {ec.fecha_aplicacion && (
                              <p className="text-xs text-muted-foreground">
                                {ec.fecha_aplicacion.split('-').reverse().join('/')}
                              </p>
                            )}
                          </div>
                          {ec.calificacion != null && (
                            <Badge
                              variant={ec.calificacion >= 70 ? "default" : "destructive"}
                              className="shrink-0 text-xs min-w-[2.5rem] justify-center"
                            >
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
        </DialogContent>
      </Dialog>
    </>
  )
}
