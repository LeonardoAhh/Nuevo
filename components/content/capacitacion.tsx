"use client"

import { useState, useEffect, useCallback } from "react"
import { Briefcase, BookOpen, ClipboardList, Upload } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCapacitacion, useRole } from "@/lib/hooks"
import type { Department, Position, Course, PositionCourse, Employee, EmployeeCourse, EmployeeProgress } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { toast } from "sonner"

// Existing dialogs
import { CapEditEmployeeDialog }      from "@/components/content/cap-edit-employee-dialog"
import { CapNewEmployeeDialog }       from "@/components/content/cap-new-employee-dialog"
import { CapAddCoursesDialog }        from "@/components/content/cap-add-courses-dialog"
import { CapConfirmClearDialog }      from "@/components/content/cap-confirm-clear-dialog"
import { CapDeleteEmployeeDialog }    from "@/components/content/cap-delete-employee-dialog"
import { CapPositionCoursesDialog }   from "@/components/content/cap-position-courses-dialog"
import { CapEmployeeProgressDialog }  from "@/components/content/cap-employee-progress-dialog"
import { CapNewPositionDialog }       from "@/components/content/cap-new-position-dialog"
import { CapNewCourseDialog }         from "@/components/content/cap-new-course-dialog"

// Tab components
import { CapPositionsTab }   from "@/components/content/cap-positions-tab"
import { CapCoursesTab }     from "@/components/content/cap-courses-tab"
import { CapHistorialTab }   from "@/components/content/cap-historial-tab"
import { CapImportTab }      from "@/components/content/cap-import-tab"
import { CapBulkImportDialog } from "@/components/content/cap-bulk-import-dialog"

// Hooks
import { useBulkImport }  from "@/lib/hooks/useBulkImport"
import { useJsonImport }  from "@/lib/hooks/useJsonImport"

export default function CapacitacionContent() {
  const { isReadOnly } = useRole()
  const {
    importing, importError,
    parseJSON, importData,
    fetchDepartments, fetchPositions, fetchCourses, fetchPositionCourses,
    fetchEmployees, fetchEmployeeCourses, fetchEmployeeProgress,
    clearHistorial, deleteEmployee, createEmployeeManual, updateEmployee,
    addCoursesToEmployee, bulkImportCourseRecords,
    createPosition, createCourse,
    addCourseToPosition, removeCourseFromPosition,
  } = useCapacitacion()

  // ── Shared data ───────────────────────────────────────────────────────────
  const [departments, setDepartments]   = useState<Department[]>([])
  const [positions, setPositions]       = useState<Position[]>([])
  const [courses, setCourses]           = useState<Course[]>([])
  const [employees, setEmployees]       = useState<Employee[]>([])
  const [empCourses, setEmpCourses]     = useState<EmployeeCourse[]>([])
  const [positionCourses, setPositionCourses] = useState<PositionCourse[]>([])
  const [progressMap, setProgressMap]   = useState<Record<string, { aprobados: number; reprobados: number; total: number }>>({})

  const [loadingPositions, setLoadingPositions] = useState(false)
  const [loadingCourses, setLoadingCourses]     = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // ── Position-courses dialog ───────────────────────────────────────────────
  const [dialogOpen, setDialogOpen]           = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [posCoursesDlg, setPosCoursesDlg]     = useState<PositionCourse[]>([])
  const [loadingPosDlg, setLoadingPosDlg]     = useState(false)
  const [assignCourseId, setAssignCourseId]   = useState("")
  const [assignSaving, setAssignSaving]       = useState(false)
  const [assignError, setAssignError]         = useState<string | null>(null)

  // ── New position / new course dialogs ────────────────────────────────────
  const [newPosOpen, setNewPosOpen]     = useState(false)
  const [newPosSaving, setNewPosSaving] = useState(false)
  const [newCourseOpen, setNewCourseOpen]   = useState(false)
  const [newCourseSaving, setNewCourseSaving] = useState(false)

  // ── Employee-progress dialog ──────────────────────────────────────────────
  const [empDlgOpen, setEmpDlgOpen]               = useState(false)
  const [selectedEmp, setSelectedEmp]             = useState<Employee | null>(null)
  const [selectedEmpCourses, setSelectedEmpCourses] = useState<EmployeeCourse[]>([])
  const [empProgress, setEmpProgress]             = useState<EmployeeProgress | null>(null)
  const [loadingEmpDlg, setLoadingEmpDlg]         = useState(false)
  const [empDlgTab, setEmpDlgTab]                 = useState<'requeridos' | 'historial'>('requeridos')

  // ── Employee CRUD dialogs ─────────────────────────────────────────────────
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [deleteTarget, setDeleteTarget]         = useState<Employee | null>(null)
  const [deletingSaving, setDeletingSaving]     = useState(false)
  const [deleteError, setDeleteError]           = useState<string | null>(null)

  const [editEmpOpen, setEditEmpOpen]   = useState(false)
  const [editEmpTarget, setEditEmpTarget] = useState<Employee | null>(null)
  const [editEmpSaving, setEditEmpSaving] = useState(false)

  const [newEmpOpen, setNewEmpOpen]     = useState(false)
  const [newEmpSaving, setNewEmpSaving] = useState(false)
  const [newEmpSuccess, setNewEmpSuccess] = useState(false)

  const [addCoursesDlgOpen, setAddCoursesDlgOpen] = useState(false)
  const [addCoursesDlgEmp, setAddCoursesDlgEmp]   = useState<Employee | null>(null)
  const [addCoursesSaving, setAddCoursesSaving]   = useState(false)
  const [addCoursesSuccess, setAddCoursesSuccess] = useState(false)

  // ── Feature hooks ─────────────────────────────────────────────────────────
  const jsonImport = useJsonImport({ parseJSON, importData })

  // ── Data loaders ──────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCoursesData = useCallback(async () => {
    setLoadingCourses(true)
    try { setCourses(await fetchCourses()) }
    catch (err) { console.error("Error loading courses:", err) }
    finally { setLoadingCourses(false) }
  }, [])

  const loadProgressInBackground = useCallback(async (emps: Employee[]) => {
    const BATCH = 8
    for (let i = 0; i < emps.length; i += BATCH) {
      const batch   = emps.slice(i, i + BATCH)
      const results = await Promise.allSettled(batch.map(e => fetchEmployeeProgress(e)))
      const chunk: Record<string, { aprobados: number; reprobados: number; total: number }> = {}
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled')
          chunk[batch[idx].id] = { aprobados: r.value.aprobados, reprobados: r.value.reprobados, total: r.value.totalRequired }
      })
      setProgressMap(prev => ({ ...prev, ...chunk }))
    }
  }, [fetchEmployeeProgress])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try {
      const emps = await fetchEmployees()
      setEmployees(emps)
      setLoadingEmployees(false)
      loadProgressInBackground(emps)
    } catch (err) {
      console.error("Error loading employees:", err instanceof Error ? err.message : JSON.stringify(err))
      setLoadingEmployees(false)
    }
  }, [loadProgressInBackground])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadPositionData = useCallback(async () => {
    setLoadingPositions(true)
    try {
      const [depts, pos] = await Promise.all([fetchDepartments(), fetchPositions()])
      setDepartments(depts); setPositions(pos)
    } catch (err) { console.error("Error loading positions:", err) }
    finally { setLoadingPositions(false) }
  }, [])

  useEffect(() => { loadPositionData() }, [loadPositionData])

  const bulkImport = useBulkImport({ employees, courses, bulkImportCourseRecords, onLoadCourses: loadCoursesData })

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = useCallback(async (v: string) => {
    if (v === "cursos") {
      loadCoursesData()
      setLoadingEmployees(true)
      try {
        const [emps, poss] = await Promise.all([fetchEmployees(), fetchPositions()])
        setEmployees(emps); setPositions(poss)
        const allPosCourses = (await Promise.all(poss.map(p => fetchPositionCourses(p.id)))).flat()
        setPositionCourses(allPosCourses)
        const allEmpCourses = (await Promise.all(emps.map(e => fetchEmployeeCourses(e.id)))).flat()
        setEmpCourses(allEmpCourses)
      } catch {
        setEmployees([]); setEmpCourses([]); setPositions([]); setPositionCourses([])
      } finally {
        setLoadingEmployees(false)
      }
    }
    if (v === "historial") loadEmployees()
  }, [loadCoursesData, loadEmployees, fetchEmployees, fetchPositions, fetchPositionCourses, fetchEmployeeCourses])

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
      setAssignCourseId(''); await reloadPosCoursesDlg()
      toast.success('Curso asignado correctamente')
    } else {
      setAssignError(result.error ?? 'Error al asignar curso')
      toast.error(result.error ?? 'Error al asignar curso')
    }
  }, [assignCourseId, selectedPosition, posCoursesDlg, addCourseToPosition, reloadPosCoursesDlg])

  const handleRemoveCourseFromPos = useCallback(async (id: string) => {
    const result = await removeCourseFromPosition(id)
    if (result.success) { await reloadPosCoursesDlg(); toast.success('Curso quitado') }
    else toast.error(result.error ?? 'Error al quitar curso')
  }, [removeCourseFromPosition, reloadPosCoursesDlg])

  const handleSaveNewPos = useCallback(async (name: string, departmentId: string) => {
    setNewPosSaving(true)
    const result = await createPosition(name, departmentId)
    setNewPosSaving(false)
    if (result.success) { setNewPosOpen(false); loadPositionData(); toast.success('Puesto creado correctamente') }
    else toast.error(result.error ?? 'Error al crear puesto')
  }, [createPosition, loadPositionData])

  const handleSaveNewCourse = useCallback(async (name: string) => {
    setNewCourseSaving(true)
    const result = await createCourse(name)
    setNewCourseSaving(false)
    if (result.success) { setNewCourseOpen(false); loadCoursesData(); toast.success('Curso creado correctamente') }
    else toast.error(result.error ?? 'Error al crear curso')
  }, [createCourse, loadCoursesData])

  // ── Employee handlers ─────────────────────────────────────────────────────
  const handleViewEmployee = useCallback(async (emp: Employee) => {
    setSelectedEmp(emp); setEmpDlgOpen(true)
    setLoadingEmpDlg(true); setEmpProgress(null); setSelectedEmpCourses([])
    setEmpDlgTab('requeridos')
    try {
      const [c, p] = await Promise.all([fetchEmployeeCourses(emp.id), fetchEmployeeProgress(emp)])
      setSelectedEmpCourses(c); setEmpProgress(p)
    } catch (err) { console.error(err) }
    finally { setLoadingEmpDlg(false) }
  }, [fetchEmployeeCourses, fetchEmployeeProgress])

  const handleSaveEditEmp = useCallback(async (form: {
    numero: string; nombre: string; departamento: string; area: string;
    puesto: string; turno: string; fecha_ingreso: string; jefe_directo: string; evaluacion_desempeno: string
  }) => {
    if (!editEmpTarget) return
    setEditEmpSaving(true)
    const result = await updateEmployee(editEmpTarget.id, {
      numero: form.numero.trim() || null, nombre: form.nombre.trim(),
      puesto: form.puesto || null, departamento: form.departamento || null,
      area: form.area || null, turno: form.turno || null,
      fecha_ingreso: form.fecha_ingreso || null, jefe_directo: form.jefe_directo || null,
      evaluacion_desempeno: form.evaluacion_desempeno.trim() || null,
    })
    setEditEmpSaving(false)
    if (result.success) {
      setEditEmpOpen(false); setEditEmpTarget(null); loadEmployees()
      toast.success('Empleado actualizado')
    } else {
      toast.error(result.error ?? 'Error al actualizar')
    }
  }, [editEmpTarget, updateEmployee, loadEmployees])

  const handleSaveNewEmp = useCallback(async (
    emp: { numero: string; nombre: string; puesto: string; departamento: string; area: string; turno: string; fecha_ingreso: string; jefe_directo: string; evaluacion_desempeno: string },
    courseRows: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]
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
      courseRows.map(r => ({ course_id: r.course_id, course_name: r.course_name, fecha_aplicacion: r.fecha_aplicacion, calificacion: r.calificacion }))
    )
    setNewEmpSaving(false)
    if (result.success) { setNewEmpOpen(false); setNewEmpSuccess(true); loadEmployees(); toast.success('Empleado creado') }
    else toast.error(result.error ?? 'Error al crear empleado')
  }, [createEmployeeManual, loadEmployees])

  const handleSaveAddCourses = useCallback(async (rows: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]) => {
    if (!addCoursesDlgEmp || rows.length === 0) return
    setAddCoursesSaving(true)
    const result = await addCoursesToEmployee(
      addCoursesDlgEmp.id,
      rows.map(r => ({ course_id: r.course_id, course_name: r.course_name, fecha_aplicacion: r.fecha_aplicacion, calificacion: r.calificacion }))
    )
    setAddCoursesSaving(false)
    if (result.success) { setAddCoursesDlgOpen(false); setAddCoursesSuccess(true) }
    else toast.error(result.error ?? 'Error al guardar')
  }, [addCoursesDlgEmp, addCoursesToEmployee])

  const handleClearHistorial = useCallback(async () => {
    const result = await clearHistorial()
    if (result.success) { setConfirmClearOpen(false); setEmployees([]); toast.success(`Historial eliminado`) }
    else toast.error(result.error ?? 'Error al eliminar historial')
  }, [clearHistorial])

  const handleDeleteEmployee = useCallback(async () => {
    if (!deleteTarget) return
    setDeletingSaving(true); setDeleteError(null)
    const result = await deleteEmployee(deleteTarget.id, deleteTarget.numero)
    setDeletingSaving(false)
    if (result.success) {
      setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id))
      setDeleteTarget(null); toast.success('Empleado eliminado')
    } else {
      setDeleteError(result.error ?? 'Error al eliminar')
      toast.error(result.error ?? 'Error al eliminar')
    }
  }, [deleteTarget, deleteEmployee])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ReadOnlyBanner />
      <Tabs defaultValue="puestos" onValueChange={handleTabChange}>
        <TabsList className="flex w-full mb-4">
          <TabsTrigger value="puestos"   className="flex-1 text-xs sm:text-sm">
            <Briefcase    className="mr-1 sm:mr-2 h-4 w-4" /><span>Puestos</span>
          </TabsTrigger>
          <TabsTrigger value="cursos"    className="flex-1 text-xs sm:text-sm">
            <BookOpen     className="mr-1 sm:mr-2 h-4 w-4" /><span>Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex-1 text-xs sm:text-sm">
            <ClipboardList className="mr-1 sm:mr-2 h-4 w-4" /><span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="importar"  className="hidden">
            <Upload className="mr-1 sm:mr-2 h-4 w-4" /><span>Importar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="puestos">
          <CapPositionsTab
            departments={departments}
            positions={positions}
            loadingPositions={loadingPositions}
            isReadOnly={isReadOnly}
            onNewPosition={() => setNewPosOpen(true)}
            onViewCourses={handleViewCourses}
          />
        </TabsContent>

        <TabsContent value="cursos">
          <CapCoursesTab
            courses={courses}
            loadingCourses={loadingCourses}
            isReadOnly={isReadOnly}
            positions={positions}
            positionCourses={positionCourses}
            employees={employees}
            empCourses={empCourses}
            onNewCourse={() => setNewCourseOpen(true)}
          />
        </TabsContent>

        <TabsContent value="historial">
          <CapHistorialTab
            employees={employees}
            loadingEmployees={loadingEmployees}
            progressMap={progressMap}
            isReadOnly={isReadOnly}
            newEmpSuccess={newEmpSuccess}
            addCoursesSuccess={addCoursesSuccess}
            onNewEmployee={() => { setNewEmpSuccess(false); setNewEmpOpen(true) }}
            onBulkImport={bulkImport.openDialog}
            onViewEmployee={handleViewEmployee}
            onEditEmployee={(emp) => { setEditEmpTarget(emp); setEditEmpOpen(true) }}
            onAddCourses={(emp) => { setAddCoursesDlgEmp(emp); setAddCoursesDlgOpen(true); if (courses.length === 0) loadCoursesData() }}
            onDeleteEmployee={(emp) => { setDeleteError(null); setDeleteTarget(emp) }}
          />
        </TabsContent>

        <TabsContent value="importar">
          <CapImportTab
            jsonText={jsonImport.jsonText}
            setJsonText={jsonImport.setJsonText}
            preview={jsonImport.preview}
            parseError={jsonImport.parseError}
            importSuccess={jsonImport.importSuccess}
            fileInputRef={jsonImport.fileInputRef}
            isReadOnly={isReadOnly}
            importing={importing}
            importError={importError}
            handleParse={jsonImport.handleParse}
            handleFileUpload={jsonImport.handleFileUpload}
            handleImport={jsonImport.handleImport}
            handleReset={jsonImport.handleReset}
          />
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
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
        courses={courses}
        loadingCourses={loadingCourses}
        onClose={() => setNewEmpOpen(false)}
        onLoadCourses={loadCoursesData}
        onSave={handleSaveNewEmp}
      />

      <CapConfirmClearDialog
        open={confirmClearOpen}
        saving={importing}
        isReadOnly={isReadOnly}
        employeeCount={employees.length}
        error={importError}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearHistorial}
      />

      <CapEditEmployeeDialog
        employee={editEmpTarget}
        open={editEmpOpen}
        saving={editEmpSaving}
        isReadOnly={isReadOnly}
        onClose={() => { setEditEmpOpen(false); setEditEmpTarget(null) }}
        onSave={handleSaveEditEmp}
      />

      <CapDeleteEmployeeDialog
        employee={deleteTarget}
        open={!!deleteTarget}
        saving={deletingSaving}
        isReadOnly={isReadOnly}
        error={deleteError}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEmployee}
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
    </>
  )
}
