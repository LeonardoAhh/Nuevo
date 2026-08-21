"use client"

import { useState, useEffect, useCallback } from "react"
import { Briefcase, BookOpen, ClipboardList, Upload } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useCapacitacion, useRole } from "@/lib/hooks"
import type { Department, Position, Course, PositionCourse, Employee, EmployeeCourse, EmployeeProgress } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { notify } from "@/lib/notify"

// Existing dialogs
import { CapEditEmployeeDialog } from "@/components/content/cap-edit-employee-dialog"
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
import { IncidenciasModal } from "@/components/content/incidencias-modal"
import { ActasSeguimientoModal } from "@/components/content/actas-seguimiento-modal"

// Hooks
import { useBulkImport } from "@/lib/hooks/useBulkImport"
import { useJsonImport } from "@/lib/hooks/useJsonImport"

export default function CapacitacionContent() {
  const { isReadOnly } = useRole()
  const {
    importing, importError,
    parseJSON, importData,
    fetchDepartments, fetchPositions, fetchCourses, fetchPositionCourses,
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

  const [addCoursesDlgOpen, setAddCoursesDlgOpen] = useState(false)
  const [addCoursesDlgEmp, setAddCoursesDlgEmp] = useState<Employee | null>(null)
  const [addCoursesSaving, setAddCoursesSaving] = useState(false)
  const [addCoursesSuccess, setAddCoursesSuccess] = useState(false)

  // ── Feature hooks ─────────────────────────────────────────────────────────
  const jsonImport = useJsonImport({ parseJSON, importData })

  // ── Data loaders ──────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCoursesData = useCallback(async () => {
    setLoadingCourses(true)
    try { setCourses(await fetchCourses()) }
    catch (err) { console.error("Error loading courses:", err); notify.error("Error al cargar cursos") }
    finally { setLoadingCourses(false) }
  }, [])



  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try {
      const emps = await fetchEmployees()
      setEmployees(emps)
      setLoadingEmployees(false)
    } catch (err) {
      console.error("Error loading employees:", err instanceof Error ? err.message : JSON.stringify(err))
      notify.error("Error al cargar empleados")
      setLoadingEmployees(false)
    }
  }, [fetchEmployees])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadPositionData = useCallback(async () => {
    setLoadingPositions(true)
    try {
      const [depts, pos] = await Promise.all([fetchDepartments(), fetchPositions()])
      setDepartments(depts); setPositions(pos)
    } catch (err) { console.error("Error loading positions:", err); notify.error("Error al cargar puestos") }
    finally { setLoadingPositions(false) }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPositionData()
    loadEmployees()
  }, [])

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
      notify.success('Curso asignado correctamente')
    } else {
      setAssignError(result.error ?? 'Error al asignar curso')
      notify.error(result.error ?? 'Error al asignar curso')
    }
  }, [assignCourseId, selectedPosition, posCoursesDlg, addCourseToPosition, reloadPosCoursesDlg])

  const handleRemoveCourseFromPos = useCallback(async (id: string) => {
    const result = await removeCourseFromPosition(id)
    if (result.success) { await reloadPosCoursesDlg(); notify.success('Curso quitado') }
    else notify.error(result.error ?? 'Error al quitar curso')
  }, [removeCourseFromPosition, reloadPosCoursesDlg])

  const handleSaveNewPos = useCallback(async (name: string, departmentId: string) => {
    setNewPosSaving(true)
    const result = await createPosition(name, departmentId)
    setNewPosSaving(false)
    if (result.success) { setNewPosOpen(false); loadPositionData(); notify.success('Puesto creado correctamente') }
    else notify.error(result.error ?? 'Error al crear puesto')
  }, [createPosition, loadPositionData])

  const handleSaveNewCourse = useCallback(async (name: string, tipo: string, durationHours: number | null) => {
    setNewCourseSaving(true)
    const result = await createCourse(name, tipo, durationHours)
    setNewCourseSaving(false)
    if (result.success) { setNewCourseOpen(false); loadCoursesData(); notify.success('Curso creado correctamente') }
    else notify.error(result.error ?? 'Error al crear curso')
  }, [createCourse, loadCoursesData])

  const handleSaveEditCourse = useCallback(async (id: string, data: { name: string; tipo: string; duration_hours: number | null }) => {
    setEditCourseSaving(true)
    const result = await updateCourse(id, data)
    setEditCourseSaving(false)
    if (result.success) {
      setEditCourseOpen(false); setEditCourseTarget(null); loadCoursesData()
      notify.success('Curso actualizado')
    } else {
      notify.error(result.error ?? 'Error al actualizar curso')
    }
  }, [updateCourse, loadCoursesData])

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
      notify.success('Empleado actualizado')
    } else {
      notify.error(result.error ?? 'Error al actualizar')
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
    if (result.success) { setNewEmpOpen(false); setNewEmpSuccess(true); loadEmployees(); notify.success('Empleado creado') }
    else notify.error(result.error ?? 'Error al crear empleado')
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
    else notify.error(result.error ?? 'Error al guardar')
  }, [addCoursesDlgEmp, addCoursesToEmployee])

  const handleClearHistorial = useCallback(async () => {
    const ok = await notify.confirm({
      title: "Borrar historial",
      description: `Se eliminarán ${employees.length} empleados y sus registros. No se puede deshacer.`,
      confirmLabel: "Borrar",
      tone: "destructive",
    })
    if (!ok) return
    const result = await clearHistorial()
    if (result.success) { setConfirmClearOpen(false); setEmployees([]); notify.success(`Historial eliminado`) }
    else notify.error(result.error ?? 'Error al eliminar historial')
  }, [clearHistorial, employees.length])

  // ── Incidencias modal state ─────────────────────────────────────────────
  const [incidenciasOpen, setIncidenciasOpen] = useState(false)
  const [incidenciasEmpleado, setIncidenciasEmpleado] = useState<{ numero: string; nombre: string } | null>(null)

  const handleOpenIncidencias = useCallback((emp: Employee) => {
    if (!emp.numero) return
    setIncidenciasEmpleado({ numero: emp.numero, nombre: emp.nombre })
    setIncidenciasOpen(true)
  }, [])

  // ── Actas / Seguimiento modal state ────────────────────────────────────────
  const [actasOpen, setActasOpen] = useState(false)
  const [actasEmpleado, setActasEmpleado] = useState<{ numero: string; nombre: string } | null>(null)

  const handleOpenActas = useCallback((emp: Employee) => {
    if (!emp.numero) return
    setActasEmpleado({ numero: emp.numero, nombre: emp.nombre })
    setActasOpen(true)
  }, [])

  const handleDeleteEmployee = useCallback(async (emp: Employee) => {
    const ok = await notify.confirm({
      title: "Eliminar empleado",
      description: `Se eliminará a ${emp.nombre} y todos sus datos. No se puede deshacer.`,
      confirmLabel: "Eliminar",
      tone: "destructive",
      requireInputText: "ELIMINAR",
    })
    if (!ok) return
    const result = await deleteEmployee(emp.id, emp.numero)
    if (result.success) {
      setEmployees(prev => prev.filter(e => e.id !== emp.id))
      notify.success('Empleado eliminado')
    } else {
      notify.error(result.error ?? 'Error al eliminar')
    }
  }, [deleteEmployee])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ReadOnlyBanner />
      <Tabs defaultValue="historial" onValueChange={handleTabChange}>
        <TabsList className="flex w-full mb-6 bg-muted rounded-md p-1 border-0 shadow-none">
          <TabsTrigger value="historial" className="flex-1 text-sm font-medium rounded-[6px] py-2 data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-sm transition-all text-muted-foreground">
            <ClipboardList className="mr-2 h-[18px] w-[18px]" /><span>Empleados</span>
          </TabsTrigger>
          <TabsTrigger value="cursos" className="flex-1 text-sm font-medium rounded-[6px] py-2 data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-sm transition-all text-muted-foreground">
            <BookOpen className="mr-2 h-[18px] w-[18px]" /><span>Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="puestos" className="flex-1 text-sm font-medium rounded-[6px] py-2 data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-sm transition-all text-muted-foreground">
            <Briefcase className="mr-2 h-[18px] w-[18px]" /><span>Puestos</span>
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
              isReadOnly={isReadOnly}
              newEmpSuccess={newEmpSuccess}
              addCoursesSuccess={addCoursesSuccess}
              onNewEmployee={() => { setNewEmpSuccess(false); setNewEmpOpen(true) }}
              onBulkImport={bulkImport.openDialog}
              onBulkCreateEmployees={() => setBulkCreateEmpOpen(true)}
              onViewEmployee={handleViewEmployee}
              onEditEmployee={(emp) => { setEditEmpTarget(emp); setEditEmpOpen(true) }}
              onAddCourses={(emp) => { setAddCoursesDlgEmp(emp); setAddCoursesDlgOpen(true); if (courses.length === 0) loadCoursesData() }}
              onDeleteEmployee={handleDeleteEmployee}
              onIncidencias={handleOpenIncidencias}
              onActasSeguimiento={handleOpenActas}
            />
          </motion.div>
        </TabsContent>

      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <CapBulkCreateEmployees
        open={bulkCreateEmpOpen}
        onClose={() => setBulkCreateEmpOpen(false)}
        onCreated={() => { setBulkCreateEmpOpen(false); loadEmployees() }}
      />

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

      {incidenciasEmpleado && (
        <IncidenciasModal
          open={incidenciasOpen}
          onClose={() => setIncidenciasOpen(false)}
          numeroEmpleado={incidenciasEmpleado.numero}
          nombreEmpleado={incidenciasEmpleado.nombre}
        />
      )}

      {actasEmpleado && (
        <ActasSeguimientoModal
          open={actasOpen}
          onClose={() => setActasOpen(false)}
          numeroEmpleado={actasEmpleado.numero}
          nombreEmpleado={actasEmpleado.nombre}
        />
      )}
    </>
  )
}
