"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Briefcase, BookOpen, ClipboardList, Upload } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useCapacitacion, useRole } from "@/lib/hooks"
import { getLatestEmployeeCourseAttempts } from "@/lib/hooks/useCapacitacion"
import type { Department, Position, Course, PositionCourse, Employee, EmployeeCourse, EmployeeProgress } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { notify } from "@/lib/notify"

// Existing dialogs
import { CapEditEmployeeDialog, type EditEmployeeForm } from "@/components/content/cap-edit-employee-dialog"
import { CapNewEmployeeDialog } from "@/components/redesign/cap-new-employee-dialog"
import { CapAddCoursesDialog } from "@/components/content/cap-add-courses-dialog"
import { CapPositionCoursesDialog } from "@/components/content/cap-position-courses-dialog"
import { CapEmployeeProgressDialog } from "@/components/redesign/cap-employee-progress-dialog"
import { CapNewPositionDialog } from "@/components/content/cap-new-position-dialog"
import { CapNewCourseDialog } from "@/components/content/cap-new-course-dialog"
import { CapEditCourseDialog } from "@/components/content/cap-edit-course-dialog"

// Tab components
import { CapPositionsTab } from "@/components/content/cap-positions-tab"
import { CapCoursesTab } from "@/components/content/cap-courses-tab"
import { CapHistorialTab } from "@/components/content/cap-historial-tab"
import { CapBulkImportDialog } from "@/components/redesign/cap-bulk-import-dialog"
import { CapBulkCreateEmployees } from "@/components/redesign/cap-bulk-create-employees"
import { EmployeeDayCountImportDialog } from "@/components/content/employee-day-count-import-dialog"
import { useActasSeguimiento } from "@/lib/hooks/useActasSeguimiento"
import { useReglamentoIncumplimientos } from "@/lib/hooks/useReglamentoIncumplimientos"

// Hooks
import { useBulkImport } from "@/lib/hooks/useBulkImport"
import { useJsonImport } from "@/lib/hooks/useJsonImport"

export default function CapacitacionContent() {
  const { canEdit, isReadOnly } = useRole()
  const { replaceMonths: replaceActasMonths } = useActasSeguimiento()
  const { replaceMonths: replaceIncumplimientosMonths } = useReglamentoIncumplimientos()
  const {
    importing, importError,
    parseJSON, importData,
    fetchDepartments, fetchPositions, fetchCourses, fetchPositionCourses,
    fetchAllPositionCourses, fetchAllEmployeeCourses,
    fetchEmployees, fetchEmployeeCourses, fetchEmployeeProgress,
    clearHistorial, deleteEmployee, createEmployeeManual, updateEmployee,
    addCoursesToEmployee, bulkImportCourseRecords,
    createPosition, createCourse, updateCourse,
    addCourseToPosition, removeCourseFromPosition,
  } = useCapacitacion()

  // ── Shared data ───────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [empCourses, setEmpCourses] = useState<EmployeeCourse[]>([])
  const [positionCourses, setPositionCourses] = useState<PositionCourse[]>([])
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const employeesLoaded = useRef(false)
  const employeesLoadPromise = useRef<Promise<void> | null>(null)
  const positionsLoaded = useRef(false)
  const positionsLoadPromise = useRef<Promise<void> | null>(null)
  const coursesTabDataLoaded = useRef(false)
  const coursesTabDataVersion = useRef(0)
  const coursesTabLoadPromise = useRef<Promise<void> | null>(null)

  // ── Position-courses dialog ───────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [posCoursesDlg, setPosCoursesDlg] = useState<PositionCourse[]>([])
  const [loadingPosDlg, setLoadingPosDlg] = useState(false)
  const [assignCourseId, setAssignCourseId] = useState("")
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  // ── New position / new course dialogs ────────────────────────────────────
  const [newPosOpen, setNewPosOpen] = useState(false)
  const [newPosSaving, setNewPosSaving] = useState(false)
  const [newCourseOpen, setNewCourseOpen] = useState(false)
  const [newCourseSaving, setNewCourseSaving] = useState(false)
  const [editCourseOpen, setEditCourseOpen] = useState(false)
  const [editCourseTarget, setEditCourseTarget] = useState<Course | null>(null)
  const [editCourseSaving, setEditCourseSaving] = useState(false)

  // ── Employee-progress dialog ──────────────────────────────────────────────
  const [empDlgOpen, setEmpDlgOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [selectedEmpCourses, setSelectedEmpCourses] = useState<EmployeeCourse[]>([])
  const [empProgress, setEmpProgress] = useState<EmployeeProgress | null>(null)
  const [loadingEmpDlg, setLoadingEmpDlg] = useState(false)
  const [empDlgTab, setEmpDlgTab] = useState<'requeridos' | 'historial'>('requeridos')

  // ── Employee CRUD dialogs ─────────────────────────────────────────────────
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const [editEmpOpen, setEditEmpOpen] = useState(false)
  const [editEmpTarget, setEditEmpTarget] = useState<Employee | null>(null)
  const [editEmpSaving, setEditEmpSaving] = useState(false)

  const [newEmpOpen, setNewEmpOpen] = useState(false)
  const [bulkCreateEmpOpen, setBulkCreateEmpOpen] = useState(false)
  const [newEmpSaving, setNewEmpSaving] = useState(false)
  const [newEmpSuccess, setNewEmpSuccess] = useState(false)
  const [reglamentoImportOpen, setReglamentoImportOpen] = useState(false)
  const [actasImportOpen, setActasImportOpen] = useState(false)

  const [addCoursesDlgOpen, setAddCoursesDlgOpen] = useState(false)
  const [addCoursesDlgEmp, setAddCoursesDlgEmp] = useState<Employee | null>(null)
  const [addCoursesSaving, setAddCoursesSaving] = useState(false)
  const [addCoursesSuccess, setAddCoursesSuccess] = useState(false)

  // ── Feature hooks ─────────────────────────────────────────────────────────
  const jsonImport = useJsonImport({ parseJSON, importData })

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadCoursesData = useCallback(async () => {
    setLoadingCourses(true)
    try { setCourses(await fetchCourses()) }
    catch (err) { console.error("Error loading courses:", err); notify.error("Error al cargar cursos") }
    finally { setLoadingCourses(false) }
  }, [fetchCourses])

  const loadEmployees = useCallback((refresh = false) => {
    if (refresh) employeesLoaded.current = false
    if (employeesLoaded.current) return Promise.resolve()
    if (employeesLoadPromise.current) return employeesLoadPromise.current

    setLoadingEmployees(true)
    const loadPromise = (async () => {
      try {
        setEmployees(await fetchEmployees())
        employeesLoaded.current = true
      } catch (err) {
        console.error("Error loading employees:", err instanceof Error ? err.message : JSON.stringify(err))
        notify.error("Error al cargar empleados")
      } finally {
        setLoadingEmployees(false)
        employeesLoadPromise.current = null
      }
    })()
    employeesLoadPromise.current = loadPromise
    return loadPromise
  }, [fetchEmployees])

  const loadPositionData = useCallback((refresh = false) => {
    if (refresh) positionsLoaded.current = false
    if (positionsLoaded.current) return Promise.resolve()
    if (positionsLoadPromise.current) return positionsLoadPromise.current

    setLoadingPositions(true)
    const loadPromise = (async () => {
      try {
        const [depts, pos] = await Promise.all([fetchDepartments(), fetchPositions()])
        setDepartments(depts); setPositions(pos)
        positionsLoaded.current = true
      } catch (err) {
        console.error("Error loading positions:", err)
        notify.error("Error al cargar puestos")
      } finally {
        setLoadingPositions(false)
        positionsLoadPromise.current = null
      }
    })()
    positionsLoadPromise.current = loadPromise
    return loadPromise
  }, [fetchDepartments, fetchPositions])

  const invalidateCoursesTabData = useCallback(() => {
    coursesTabDataLoaded.current = false
    coursesTabDataVersion.current += 1
  }, [])

  const importCourseRecords = useCallback(async (records: Parameters<typeof bulkImportCourseRecords>[0]) => {
    const result = await bulkImportCourseRecords(records)
    if (result.success) invalidateCoursesTabData()
    return result
  }, [bulkImportCourseRecords, invalidateCoursesTabData])

  const loadCoursesTabData = useCallback(() => {
    if (coursesTabDataLoaded.current) return Promise.resolve()
    if (coursesTabLoadPromise.current) return coursesTabLoadPromise.current

    const requestVersion = coursesTabDataVersion.current
    const loadPromise = (async () => {
      setLoadingCourses(true)
      setLoadingEmployees(true)
      try {
        const [
          ,
          ,
          courseData,
          positionCourseData,
          employeeCourseData,
        ] = await Promise.all([
          loadEmployees(),
          loadPositionData(),
          fetchCourses(),
          fetchAllPositionCourses(),
          fetchAllEmployeeCourses(),
        ])
        if (
          requestVersion !== coursesTabDataVersion.current ||
          !employeesLoaded.current ||
          !positionsLoaded.current
        ) return
        setCourses(courseData)
        setPositionCourses(positionCourseData)
        setEmpCourses(employeeCourseData)
        coursesTabDataLoaded.current = true
      } catch (err) {
        console.error("Error loading course tab data:", err)
        notify.error("Error al cargar los datos de cursos")
      } finally {
        setLoadingCourses(false)
        setLoadingEmployees(false)
        coursesTabLoadPromise.current = null
      }
    })()

    coursesTabLoadPromise.current = loadPromise
    return loadPromise
  }, [fetchAllEmployeeCourses, fetchAllPositionCourses, fetchCourses, loadEmployees, loadPositionData])

  useEffect(() => {
    loadPositionData()
    loadEmployees()
  }, [loadEmployees, loadPositionData])

  const bulkImport = useBulkImport({ employees, courses, bulkImportCourseRecords: importCourseRecords, onLoadCourses: loadCoursesData })

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback(async (v: string) => {
    if (v === "cursos") {
      await loadCoursesTabData()
    }
  }, [loadCoursesTabData])

  // ── Position handlers ─────────────────────────────────────────────────────
  const reloadPosCoursesDlg = useCallback(async () => {
    if (!selectedPosition) return
    try { setPosCoursesDlg(await fetchPositionCourses(selectedPosition.id)) }
    catch (err) { console.error(err) }
  }, [selectedPosition, fetchPositionCourses])

  const handleViewCourses = useCallback(async (pos: Position) => {
    setSelectedPosition(pos); setDialogOpen(true); setLoadingPosDlg(true)
    setAssignCourseId(''); setAssignError(null)
    if (courses.length === 0) loadCoursesData()
    try { setPosCoursesDlg(await fetchPositionCourses(pos.id)) }
    catch (err) { console.error(err) }
    finally { setLoadingPosDlg(false) }
  }, [courses.length, loadCoursesData, fetchPositionCourses])

  const handleAssignCourse = useCallback(async () => {
    if (!assignCourseId || !selectedPosition) return
    if (posCoursesDlg.some(pc => pc.course_id === assignCourseId)) {
      setAssignError('Este curso ya está asignado al puesto'); return
    }
    setAssignSaving(true); setAssignError(null)
    const nextOrder = posCoursesDlg.length > 0 ? Math.max(...posCoursesDlg.map(pc => pc.order_index)) + 1 : 1
    const result = await addCourseToPosition(selectedPosition.id, assignCourseId, nextOrder)
    setAssignSaving(false)
    if (result.success) {
      invalidateCoursesTabData()
      setAssignCourseId(''); await reloadPosCoursesDlg()
      notify.success('Curso asignado correctamente')
    } else {
      setAssignError(result.error ?? 'Error al asignar curso')
      notify.error(result.error ?? 'Error al asignar curso')
    }
  }, [assignCourseId, selectedPosition, posCoursesDlg, addCourseToPosition, invalidateCoursesTabData, reloadPosCoursesDlg])

  const handleRemoveCourseFromPos = useCallback(async (id: string) => {
    const result = await removeCourseFromPosition(id)
    if (result.success) { invalidateCoursesTabData(); await reloadPosCoursesDlg(); notify.success('Curso quitado') }
    else notify.error(result.error ?? 'Error al quitar curso')
  }, [invalidateCoursesTabData, removeCourseFromPosition, reloadPosCoursesDlg])

  const handleSaveNewPos = useCallback(async (name: string, departmentId: string) => {
    setNewPosSaving(true)
    const result = await createPosition(name, departmentId)
    setNewPosSaving(false)
    if (result.success) { setNewPosOpen(false); loadPositionData(true); notify.success('Puesto creado correctamente') }
    else notify.error(result.error ?? 'Error al crear puesto')
  }, [createPosition, loadPositionData])

  const handleSaveNewCourse = useCallback(async (name: string, tipo: string, durationHours: number | null) => {
    setNewCourseSaving(true)
    const result = await createCourse(name, tipo, durationHours)
    setNewCourseSaving(false)
    if (result.success) { invalidateCoursesTabData(); setNewCourseOpen(false); loadCoursesData(); notify.success('Curso creado correctamente') }
    else notify.error(result.error ?? 'Error al crear curso')
  }, [createCourse, invalidateCoursesTabData, loadCoursesData])

  const handleSaveEditCourse = useCallback(async (id: string, data: { name: string; tipo: string; duration_hours: number | null }) => {
    setEditCourseSaving(true)
    const result = await updateCourse(id, data)
    setEditCourseSaving(false)
    if (result.success) {
      invalidateCoursesTabData()
      setEditCourseOpen(false); setEditCourseTarget(null); loadCoursesData()
      notify.success('Curso actualizado')
    } else {
      notify.error(result.error ?? 'Error al actualizar curso')
    }
  }, [invalidateCoursesTabData, updateCourse, loadCoursesData])

  // ── Employee handlers ─────────────────────────────────────────────────────
  const handleViewEmployee = useCallback(async (emp: Employee) => {
    setSelectedEmp(emp); setEmpDlgOpen(true)
    setLoadingEmpDlg(true); setEmpProgress(null); setSelectedEmpCourses([])
    setEmpDlgTab('requeridos')
    try {
      const courseHistory = fetchEmployeeCourses(emp.id)
      const [c, p] = await Promise.all([courseHistory, fetchEmployeeProgress(emp, courseHistory)])
      setSelectedEmpCourses(getLatestEmployeeCourseAttempts(c)); setEmpProgress(p)
    } catch (err) { console.error(err) }
    finally { setLoadingEmpDlg(false) }
  }, [fetchEmployeeCourses, fetchEmployeeProgress])

  const handleSaveEditEmp = useCallback(async (form: EditEmployeeForm) => {
    if (!editEmpTarget) return
    setEditEmpSaving(true)
    const result = await updateEmployee(editEmpTarget.id, {
      nombre: form.nombre.trim(),
      puesto: form.puesto || null, departamento: form.departamento || null,
      area: form.area || null, turno: form.turno || null,
      fecha_ingreso: form.fecha_ingreso || null, jefe_directo: form.jefe_directo || null,
      evaluacion_desempeno: form.evaluacion_desempeno.trim() || null,
    })
    setEditEmpSaving(false)
    if (result.success) {
      invalidateCoursesTabData()
      setEditEmpOpen(false); setEditEmpTarget(null); loadEmployees(true)
      notify.success('Empleado actualizado')
    } else {
      notify.error(result.error ?? 'Error al actualizar')
    }
  }, [editEmpTarget, invalidateCoursesTabData, updateEmployee, loadEmployees])

  const handleSaveNewEmp = useCallback(async (
    emp: { numero: string; nombre: string; puesto: string; departamento: string; area: string; turno: string; fecha_ingreso: string; jefe_directo: string; evaluacion_desempeno: string },
  ) => {
    setNewEmpSaving(true)
    const result = await createEmployeeManual(
      {
        numero: emp.numero.trim() || null, nombre: emp.nombre.trim(),
        puesto: emp.puesto || null, departamento: emp.departamento || null,
        area: emp.area || null, turno: emp.turno || null,
        fecha_ingreso: emp.fecha_ingreso || null, jefe_directo: emp.jefe_directo || null,
        evaluacion_desempeno: emp.evaluacion_desempeno.trim() || null,
      },
      []
    )
    setNewEmpSaving(false)
    if (result.success) { invalidateCoursesTabData(); setNewEmpOpen(false); setNewEmpSuccess(true); loadEmployees(true); notify.success('Empleado creado') }
    else notify.error(result.error ?? 'Error al crear empleado')
  }, [createEmployeeManual, invalidateCoursesTabData, loadEmployees])

  const handleSaveAddCourses = useCallback(async (rows: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]) => {
    if (!addCoursesDlgEmp || rows.length === 0) return
    setAddCoursesSaving(true)
    const result = await addCoursesToEmployee(
      addCoursesDlgEmp.id,
      rows.map(r => ({ course_id: r.course_id, course_name: r.course_name, fecha_aplicacion: r.fecha_aplicacion, calificacion: r.calificacion }))
    )
    setAddCoursesSaving(false)
    if (result.success) { invalidateCoursesTabData(); setAddCoursesDlgOpen(false); setAddCoursesSuccess(true) }
    else notify.error(result.error ?? 'Error al guardar')
  }, [addCoursesDlgEmp, addCoursesToEmployee, invalidateCoursesTabData])

  const handleClearHistorial = useCallback(async () => {
    const ok = await notify.confirm({
      title: "Borrar historial",
      description: `Se eliminarán ${employees.length} empleados y sus registros. No se puede deshacer.`,
      confirmLabel: "Borrar",
      tone: "destructive",
    })
    if (!ok) return
    const result = await clearHistorial()
    if (result.success) { invalidateCoursesTabData(); setConfirmClearOpen(false); setEmployees([]); notify.success(`Historial eliminado`) }
    else notify.error(result.error ?? 'Error al eliminar historial')
  }, [clearHistorial, employees.length, invalidateCoursesTabData])

  const handleDeleteEmployee = useCallback(async (emp: Employee) => {
    const ok = await notify.confirm({
      title: "Eliminar empleado",
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "destructive",
      requireInputText: "ELIMINAR",
    })
    if (!ok) return
    const result = await deleteEmployee(emp.id, emp.numero)
    if (result.success) {
      invalidateCoursesTabData()
      setEmployees(prev => prev.filter(e => e.id !== emp.id))
      notify.success('Empleado eliminado')
    } else {
      notify.error(result.error ?? 'Error al eliminar')
    }
  }, [deleteEmployee, invalidateCoursesTabData])

  const handleBulkEmployeesCreated = useCallback(() => {
    invalidateCoursesTabData()
    loadEmployees(true)
  }, [invalidateCoursesTabData, loadEmployees])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ReadOnlyBanner />
      <Tabs defaultValue="historial" onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex h-12 w-full rounded-md bg-muted p-1">
          <TabsTrigger value="historial" className="min-h-11 flex-1 gap-2 rounded-md px-2 py-0 text-sm font-medium text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-primary">
            <ClipboardList className="size-4" aria-hidden="true" /><span>Empleados</span>
          </TabsTrigger>
          <TabsTrigger value="cursos" className="min-h-11 flex-1 gap-2 rounded-md px-2 py-0 text-sm font-medium text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-primary">
            <BookOpen className="size-4" aria-hidden="true" /><span>Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="puestos" className="min-h-11 flex-1 gap-2 rounded-md px-2 py-0 text-sm font-medium text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-primary">
            <Briefcase className="size-4" aria-hidden="true" /><span>Puestos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="puestos" className="mt-0 outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <CapPositionsTab
              departments={departments}
              positions={positions}
              loadingPositions={loadingPositions}
              isReadOnly={isReadOnly}
              onNewPosition={() => setNewPosOpen(true)}
              onViewCourses={handleViewCourses}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="cursos" className="mt-0 outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <CapCoursesTab
              courses={courses}
              loadingCourses={loadingCourses}
              isReadOnly={isReadOnly}
              positions={positions}
              positionCourses={positionCourses}
              employees={employees}
              empCourses={empCourses}
              onNewCourse={() => setNewCourseOpen(true)}
              onEditCourse={(c) => { setEditCourseTarget(c); setEditCourseOpen(true) }}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="historial" className="mt-0 outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <CapHistorialTab
              employees={employees}
              loadingEmployees={loadingEmployees}
              canEdit={canEdit}
              newEmpSuccess={newEmpSuccess}
              addCoursesSuccess={addCoursesSuccess}
              onNewEmployee={() => { setNewEmpSuccess(false); setNewEmpOpen(true) }}
              onBulkImport={bulkImport.openDialog}
              onBulkImportIncumplimientos={() => setReglamentoImportOpen(true)}
              onBulkImportActas={() => setActasImportOpen(true)}
              onBulkCreateEmployees={() => setBulkCreateEmpOpen(true)}
              onViewEmployee={handleViewEmployee}
              onEditEmployee={(emp) => { setEditEmpTarget(emp); setEditEmpOpen(true) }}
              onAddCourses={(emp) => { setAddCoursesDlgEmp(emp); setAddCoursesDlgOpen(true); if (courses.length === 0) loadCoursesData() }}
              onDeleteEmployee={handleDeleteEmployee}
            />
          </motion.div>
        </TabsContent>

      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <CapBulkCreateEmployees
        open={bulkCreateEmpOpen}
        onClose={() => setBulkCreateEmpOpen(false)}
        onCreated={() => { setBulkCreateEmpOpen(false); handleBulkEmployeesCreated() }}
      />

      {canEdit && (
        <EmployeeDayCountImportDialog
          open={reglamentoImportOpen}
          onOpenChange={setReglamentoImportOpen}
          title="Cargar incumplimientos"
          description="Importa registros del reglamento interno desde un archivo JSON."
          itemSingular="incumplimiento"
          itemPlural="incumplimientos"
          onReplaceMonths={replaceIncumplimientosMonths}
        />
      )}
      {canEdit && (
        <EmployeeDayCountImportDialog
          open={actasImportOpen}
          onOpenChange={setActasImportOpen}
          title="Cargar actas administrativas"
          description="Importa las cantidades de actas administrativas por empleado y día desde un archivo JSON."
          itemSingular="acta administrativa"
          itemPlural="actas administrativas"
          onReplaceMonths={replaceActasMonths}
        />
      )}

      <CapBulkImportDialog
        open={bulkImport.open}
        text={bulkImport.text}
        parseError={bulkImport.parseError}
        rows={bulkImport.rows}
        saving={bulkImport.saving}
        error={bulkImport.error}
        success={bulkImport.success}
        fileRef={bulkImport.fileRef}
        courses={courses}
        isReadOnly={isReadOnly}
        onOpenChange={bulkImport.closeDialog}
        onTextChange={bulkImport.setText}
        onParse={bulkImport.handleParse}
        onFile={bulkImport.handleFile}
        onUpdateRow={bulkImport.updateRow}
        onSelectCourse={bulkImport.selectCourse}
        onImport={bulkImport.handleImport}
        onBack={bulkImport.backToEdit}
      />

      <CapAddCoursesDialog
        employee={addCoursesDlgEmp}
        open={addCoursesDlgOpen}
        saving={addCoursesSaving}
        isReadOnly={isReadOnly}
        courses={courses}
        loadingCourses={loadingCourses}
        onClose={() => setAddCoursesDlgOpen(false)}
        onSave={handleSaveAddCourses}
      />

      <CapNewEmployeeDialog
        open={newEmpOpen}
        saving={newEmpSaving}
        isReadOnly={isReadOnly}
        onClose={() => setNewEmpOpen(false)}
        onSave={handleSaveNewEmp}
      />

      <CapEditEmployeeDialog
        employee={editEmpTarget}
        open={editEmpOpen}
        saving={editEmpSaving}
        isReadOnly={isReadOnly}
        onClose={() => { setEditEmpOpen(false); setEditEmpTarget(null) }}
        onSave={handleSaveEditEmp}
      />

      <CapPositionCoursesDialog
        position={selectedPosition}
        open={dialogOpen}
        isReadOnly={isReadOnly}
        loading={loadingPosDlg}
        positionCourses={posCoursesDlg}
        courses={courses}
        assignCourseId={assignCourseId}
        assignSaving={assignSaving}
        assignError={assignError}
        onClose={() => setDialogOpen(false)}
        onAssignCourseChange={(v: string) => { setAssignCourseId(v); setAssignError(null) }}
        onAssignCourse={handleAssignCourse}
        onRemoveCourse={handleRemoveCourseFromPos}
      />

      <CapEmployeeProgressDialog
        employee={selectedEmp}
        open={empDlgOpen}
        loading={loadingEmpDlg}
        courses={selectedEmpCourses}
        progress={empProgress}
        tab={empDlgTab}
        onTabChange={(v) => setEmpDlgTab(v as 'requeridos' | 'historial')}
        onClose={() => setEmpDlgOpen(false)}
      />

      <CapNewPositionDialog
        open={newPosOpen}
        saving={newPosSaving}
        departments={departments}
        onClose={() => setNewPosOpen(false)}
        onSave={handleSaveNewPos}
      />

      <CapNewCourseDialog
        open={newCourseOpen}
        saving={newCourseSaving}
        onClose={() => setNewCourseOpen(false)}
        onSave={handleSaveNewCourse}
      />

      <CapEditCourseDialog
        course={editCourseTarget}
        open={editCourseOpen}
        saving={editCourseSaving}
        onClose={() => { setEditCourseOpen(false); setEditCourseTarget(null) }}
        onSave={handleSaveEditCourse}
      />

    </>
  )
}
