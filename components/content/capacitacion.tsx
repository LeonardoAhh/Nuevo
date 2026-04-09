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
  Users,
  ClipboardList,
  AlertTriangle,
  HelpCircle,
  Link2,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
  Trash2,
  UserPlus,
  Plus,
  Minus,
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
import { useCapacitacion } from "@/lib/hooks"
import type {
  Department, Position, Course, ImportPreview,
  CourseMatch, HistorialPreview, EmployeeCourse, Employee, EmployeeProgress,
} from "@/lib/hooks"
import { CATALOGO_ORGANIZACIONAL, TURNOS, JEFES_DE_AREA } from "@/lib/catalogo"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
  exact:       { label: 'Exacto',       color: 'text-green-600  dark:text-green-400',  bg: 'bg-green-50  dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800',  Icon: CheckCircle2 },
  alias:       { label: 'Por alias',    color: 'text-blue-600   dark:text-blue-400',   bg: 'bg-blue-50   dark:bg-blue-900/20',   border: 'border-blue-200  dark:border-blue-800',   Icon: Link2 },
  approximate: { label: 'Aproximado',   color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', Icon: AlertTriangle },
  unknown:     { label: 'Desconocido',  color: 'text-red-600    dark:text-red-400',    bg: 'bg-red-50    dark:bg-red-900/20',    border: 'border-red-200   dark:border-red-800',    Icon: HelpCircle },
} as const

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
  const {
    importing, importError,
    parseJSON, importData,
    fetchDepartments, fetchPositions, fetchCourses, fetchPositionCourses,
    fetchEmployees, fetchEmployeeCourses, fetchEmployeeProgress,
    clearHistorial, createEmployeeManual, addCoursesToEmployee,
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
  const [empSearch, setEmpSearch] = useState("")
  const [empDialogOpen, setEmpDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [empCourses, setEmpCourses] = useState<EmployeeCourse[]>([])
  const [empProgress, setEmpProgress] = useState<EmployeeProgress | null>(null)
  const [loadingEmpCourses, setLoadingEmpCourses] = useState(false)
  const [empDialogTab, setEmpDialogTab] = useState<'requeridos' | 'historial'>('requeridos')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

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
      setNewEmpOpen(false); resetNewEmp(); setNewEmpSuccess(true); loadEmployees()
    } else {
      setNewEmpError(result.error ?? 'Error al guardar')
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
    if (result.success) { setImportSuccess(true); setPreview(null); setJsonText("") }
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
    }
  }

  // ── Handlers: Empleados ───────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try { setEmployees(await fetchEmployees()) }
    catch (err) { console.error("Error loading employees:", err instanceof Error ? err.message : JSON.stringify(err)) }
    finally { setLoadingEmployees(false) }
  }, [])

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

  const filteredEmployees = employees.filter(e =>
    e.nombre.toLowerCase().includes(empSearch.toLowerCase()) ||
    (e.departamento ?? '').toLowerCase().includes(empSearch.toLowerCase()) ||
    (e.puesto ?? '').toLowerCase().includes(empSearch.toLowerCase())
  )

  // ── Grupos de matches ─────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
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
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Puestos registrados</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Consulta los puestos y sus cursos requeridos por departamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder=""
                    value={posSearch} onChange={e => setPosSearch(e.target.value)}
                    className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-full sm:w-56 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all">Todos los departamentos</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {loadingPositions ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : filteredPositions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {positions.length === 0
                    ? "No hay puestos cargados. Usa la pestaña Importar para cargar datos."
                    : "No se encontraron puestos con ese filtro."}
                </div>
              ) : (
                <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700 dark:bg-gray-900/50">
                        <TableHead className="dark:text-gray-400">Puesto</TableHead>
                        <TableHead className="dark:text-gray-400">Departamento</TableHead>
                        <TableHead className="dark:text-gray-400 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPositions.map(pos => (
                        <TableRow key={pos.id} className="dark:border-gray-700 hover:dark:bg-gray-700/50">
                          <TableCell className="font-medium dark:text-gray-200">{pos.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                              {(pos.department as any)?.name ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 dark:text-gray-300 dark:hover:bg-gray-700"
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filteredPositions.length} de {positions.length} puestos
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: CURSOS ───────────────────────────────────────────────────── */}
        <TabsContent value="cursos">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Catálogo de cursos</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Todos los cursos únicos registrados en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder=""
                  value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                  className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              {loadingCourses ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {courses.length === 0 ? "No hay cursos registrados. Importa datos primero." : "No se encontraron cursos."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCourses.map((course, idx) => (
                    <div key={course.id} className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-900/30">
                      <span className="text-xs font-mono text-gray-400 w-6 text-right shrink-0">{idx + 1}</span>
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm dark:text-gray-200 leading-tight">{course.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {newEmpSuccess ? 'Empleado registrado correctamente.' : 'Cursos guardados correctamente.'}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Lista de empleados ────────────────────────────────────────── */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="dark:text-white">Empleados</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Registro de cursos tomados por empleado.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => setConfirmClearOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Borrar
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => { setNewEmpSuccess(false); resetNewEmp(); setNewEmpOpen(true) }}
                  >
                    <UserPlus className="h-4 w-4" /> Nuevo empleado
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                    className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                {loadingEmployees ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {employees.length === 0
                      ? "Sin empleados registrados. Usa el botón \"Nuevo empleado\" para agregar."
                      : "No se encontraron empleados con esa búsqueda."}
                  </div>
                ) : (
                  <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:border-gray-700 dark:bg-gray-900/50">
                          <TableHead className="dark:text-gray-400">Empleado</TableHead>
                          <TableHead className="dark:text-gray-400 hidden sm:table-cell">Puesto</TableHead>
                          <TableHead className="dark:text-gray-400 hidden md:table-cell">Departamento</TableHead>
                          <TableHead className="dark:text-gray-400 text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map(emp => (
                          <TableRow key={emp.id} className="dark:border-gray-700 hover:dark:bg-gray-700/50">
                            <TableCell className="font-medium dark:text-gray-200">{emp.nombre}</TableCell>
                            <TableCell className="dark:text-gray-400 text-sm hidden sm:table-cell">{emp.puesto ?? "—"}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {emp.departamento && (
                                <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300 text-xs">
                                  {emp.departamento}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                  onClick={() => openAddCoursesDlg(emp)}
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Cursos</span>
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 dark:text-gray-300 dark:hover:bg-gray-700"
                                  onClick={() => handleViewEmployee(emp)}
                                >
                                  Ver <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
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

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Cargar catálogo JSON</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Estructura con{" "}
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">position</code>,{" "}
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">department</code> y{" "}
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">requiredCourses_*</code>.
                  Los campos vacíos se ignorarán automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="h-10 w-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium dark:text-gray-200">Arrastra un archivo JSON o haz clic para seleccionar</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo archivos .json</p>
                  <input ref={fileInputRef} type="file" accept=".json,application/json"
                    onChange={handleFileUpload} className="hidden" />
                </div>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1 dark:bg-gray-700" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">o pega el JSON</span>
                  <Separator className="flex-1 dark:bg-gray-700" />
                </div>

                <textarea
                  value={jsonText}
                  onChange={e => { setJsonText(e.target.value); setPreview(null); setParseError(null) }}
                  placeholder='[{ "position": "...", "department": "...", "requiredCourses_1": "..." }]'
                  rows={8}
                  className="w-full rounded-xl border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-2 justify-end">
                  {(jsonText || preview || importSuccess) && (
                    <Button variant="outline" onClick={handleReset} className="gap-2 dark:border-gray-600 dark:text-gray-200">
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
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Vista previa de importación
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
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
                      <div key={label} className="rounded-lg border dark:border-gray-700 p-3 text-center">
                        <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xl font-bold dark:text-white">{value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-medium dark:text-gray-200 mb-2">Departamentos detectados</p>
                    <div className="flex flex-wrap gap-2">
                      {preview.departments.map(d => (
                        <Badge key={d} variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">{d}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium dark:text-gray-200 mb-2">
                      Puestos (mostrando {Math.min(5, preview.positions.length)} de {preview.positions.length})
                    </p>
                    <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700 dark:bg-gray-900/50">
                            <TableHead className="dark:text-gray-400">Puesto</TableHead>
                            <TableHead className="dark:text-gray-400">Departamento</TableHead>
                            <TableHead className="dark:text-gray-400 text-right">Cursos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.positions.slice(0, 5).map((pos, i) => (
                            <TableRow key={i} className="dark:border-gray-700">
                              <TableCell className="font-medium dark:text-gray-200 text-sm">{pos.name}</TableCell>
                              <TableCell className="dark:text-gray-400 text-sm">{pos.department}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{pos.courses.length}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleImport} disabled={importing} className="gap-2">
                      {importing ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Importando...</>
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
      <Dialog open={addCoursesDlgOpen} onOpenChange={open => { if (!open) setAddCoursesError(null); setAddCoursesDlgOpen(open) }}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Agregar cursos
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {addCoursesRows.map((row, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Curso</label>
                          <Select value={row.course_id} onValueChange={v => updateAddCoursesRow(i, 'course_id', v)}>
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                              {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {addCoursesRows.length > 1 && (
                          <button
                            onClick={() => removeAddCoursesRow(i)}
                            className="mt-5 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha aplicación</label>
                          <Input type="date"
                            value={row.fecha_aplicacion}
                            onChange={e => updateAddCoursesRow(i, 'fecha_aplicacion', e.target.value)}
                            className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Calificación</label>
                          <Input type="number" min="0" max="100"
                            value={row.calificacion}
                            onChange={e => updateAddCoursesRow(i, 'calificacion', e.target.value)}
                            className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addAddCoursesRow}
                  className="w-full gap-2 dark:border-gray-600 dark:text-gray-200">
                  <Plus className="h-4 w-4" /> Agregar otro curso
                </Button>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddCoursesDlgOpen(false)}
              className="dark:border-gray-600 dark:text-gray-200">
              Cancelar
            </Button>
            <Button onClick={handleSaveAddCourses} disabled={addCoursesSaving} className="gap-2">
              {addCoursesSaving
                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</>
                : 'Guardar cursos'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nuevo Empleado ───────────────────────────────────────── */}
      <Dialog open={newEmpOpen} onOpenChange={open => { if (!open) resetNewEmp(); setNewEmpOpen(open) }}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nuevo empleado
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Paso {newEmpStep} de 2 — {newEmpStep === 1 ? 'Datos del empleado' : 'Cursos tomados (opcional)'}
            </DialogDescription>
          </DialogHeader>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${newEmpStep >= 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${newEmpStep >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
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
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">N.N</label>
                  <Input
                    value={newEmpForm.numero}
                    onChange={e => setNewEmpForm(f => ({ ...f, numero: e.target.value }))}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fecha de ingreso</label>
                  <Input type="date"
                    value={newEmpForm.fecha_ingreso}
                    onChange={e => setNewEmpForm(f => ({ ...f, fecha_ingreso: e.target.value }))}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nombre completo <span className="text-red-500">*</span></label>
                <Input
                  value={newEmpForm.nombre}
                  onChange={e => setNewEmpForm(f => ({ ...f, nombre: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Departamento</label>
                <Select
                  value={newEmpForm.departamento}
                  onValueChange={v => setNewEmpForm(f => ({ ...f, departamento: v, area: '', puesto: '' }))}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                    {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Área</label>
                  <Select
                    value={newEmpForm.area}
                    onValueChange={v => setNewEmpForm(f => ({ ...f, area: v }))}
                    disabled={newEmpAreas.length === 0}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                      {newEmpAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Turno</label>
                  <Select
                    value={newEmpForm.turno}
                    onValueChange={v => setNewEmpForm(f => ({ ...f, turno: v }))}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Puesto</label>
                <Select
                  value={newEmpForm.puesto}
                  onValueChange={v => setNewEmpForm(f => ({ ...f, puesto: v }))}
                  disabled={newEmpPuestos.length === 0}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                    {newEmpPuestos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Jefe directo</label>
                <Select
                  value={newEmpForm.jefe_directo}
                  onValueChange={v => setNewEmpForm(f => ({ ...f, jefe_directo: v }))}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
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
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                <>
                  {newEmpCourseRows.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Sin cursos agregados. Puedes guardar así o agregar cursos tomados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {newEmpCourseRows.map((row, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Curso</label>
                              <Select
                                value={row.course_id}
                                onValueChange={v => updateCourseRow(i, 'course_id', v)}
                              >
                                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                                  {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <button
                              onClick={() => removeCourseRow(i)}
                              className="mt-5 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha aplicación</label>
                              <Input type="date"
                                value={row.fecha_aplicacion}
                                onChange={e => updateCourseRow(i, 'fecha_aplicacion', e.target.value)}
                                className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Calificación</label>
                              <Input type="number" min="0" max="100"
                                value={row.calificacion}
                                onChange={e => updateCourseRow(i, 'calificacion', e.target.value)}
                                className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={addCourseRow}
                    className="w-full gap-2 dark:border-gray-600 dark:text-gray-200">
                    <Plus className="h-4 w-4" /> Agregar curso
                  </Button>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            {newEmpStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => { resetNewEmp(); setNewEmpOpen(false) }}
                  className="dark:border-gray-600 dark:text-gray-200">
                  Cancelar
                </Button>
                <Button onClick={handleNewEmpNext}>
                  Siguiente →
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setNewEmpStep(1)}
                  className="dark:border-gray-600 dark:text-gray-200">
                  ← Anterior
                </Button>
                <Button onClick={handleSaveNewEmp} disabled={newEmpSaving} className="gap-2">
                  {newEmpSaving
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Guardando...</>
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
        <DialogContent className="sm:max-w-sm dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Borrar historial
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Se eliminarán <strong className="dark:text-gray-200">{employees.length} empleados</strong> y
              todos sus registros de cursos tomados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmClearOpen(false)}
              className="dark:border-gray-600 dark:text-gray-200"
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistorial}
              disabled={importing}
              className="gap-2"
            >
              {importing ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Borrando...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Sí, borrar todo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Cursos requeridos del puesto ──────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{selectedPosition?.name}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {(selectedPosition?.department as any)?.name} · Cursos requeridos
            </DialogDescription>
          </DialogHeader>
          {loadingDialog ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : positionCourses.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No hay cursos registrados para este puesto.
            </p>
          ) : (
            <div className="space-y-2">
              {positionCourses.map((pc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border dark:border-gray-700">
                  <span className="text-xs font-mono text-gray-400 w-5 text-right shrink-0">{pc.order_index}</span>
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm dark:text-gray-200">{pc.course.name}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Progreso del empleado ─────────────────────────────────── */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="sm:max-w-xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{selectedEmployee?.nombre}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {selectedEmployee?.puesto}{selectedEmployee?.departamento ? ` · ${selectedEmployee.departamento}` : ''}
            </DialogDescription>
          </DialogHeader>

          {loadingEmpCourses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de progreso y resumen (solo si hay puesto en catálogo) */}
              {empProgress?.positionFound && empProgress.totalRequired > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium dark:text-gray-200">
                      {empProgress.aprobados} / {empProgress.totalRequired} cursos requeridos
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {Math.round((empProgress.aprobados / empProgress.totalRequired) * 100)}%
                    </span>
                  </div>
                  {/* Barra segmentada */}
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 gap-px">
                    {empProgress.aprobados > 0 && (
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(empProgress.aprobados / empProgress.totalRequired) * 100}%` }}
                      />
                    )}
                    {empProgress.reprobados > 0 && (
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${(empProgress.reprobados / empProgress.totalRequired) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> {empProgress.aprobados} aprobados
                    </span>
                    <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                      <XCircle className="h-3 w-3" /> {empProgress.reprobados} reprobados
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" /> {empProgress.pendientes} pendientes
                    </span>
                  </div>
                </div>
              )}

              {empProgress && !empProgress.positionFound && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
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
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 dark:bg-gray-700">
                        {empProgress.totalRequired}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex-1 text-xs sm:text-sm">
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    Historial completo
                    {empCourses.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 dark:bg-gray-700">
                        {empCourses.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── Requeridos ───────────────────────────────────────── */}
                <TabsContent value="requeridos" className="mt-3">
                  {!empProgress?.positionFound || empProgress.totalRequired === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
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
                            ${c.status === 'aprobado'  ? 'bg-green-50  dark:bg-green-900/10  border-green-200 dark:border-green-800' : ''}
                            ${c.status === 'reprobado' ? 'bg-red-50    dark:bg-red-900/10    border-red-200   dark:border-red-800'   : ''}
                            ${c.status === 'pendiente' ? 'bg-gray-50   dark:bg-gray-900/40   border-gray-200  dark:border-gray-700'  : ''}
                          `}
                        >
                          {c.status === 'aprobado'  && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                          {c.status === 'reprobado' && <XCircle      className="h-4 w-4 text-red-500   shrink-0" />}
                          {c.status === 'pendiente' && <Clock        className="h-4 w-4 text-gray-400   shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm dark:text-gray-200 leading-tight truncate">{c.courseName}</p>
                            {c.fechaAplicacion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {c.fechaAplicacion.split('-').reverse().join('/')}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {c.calificacion != null ? (
                              <Badge
                                className={`text-xs font-bold min-w-[2.5rem] justify-center
                                  ${c.status === 'aprobado'  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700' : ''}
                                  ${c.status === 'reprobado' ? 'bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300   border border-red-300   dark:border-red-700'  : ''}
                                `}
                              >
                                {c.calificacion}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 w-16 text-right block">—</span>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                      No hay cursos registrados para este empleado.
                    </p>
                  ) : (
                    <div className="space-y-1.5 pb-2">
                      {empCourses.map((ec, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border dark:border-gray-700">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm dark:text-gray-200 truncate leading-tight">
                              {ec.course?.name ?? ec.raw_course_name}
                            </p>
                            {ec.fecha_aplicacion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
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
