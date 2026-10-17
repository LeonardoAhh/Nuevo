"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRole } from "@/lib/hooks"
import { CATALOGO_ORGANIZACIONAL } from "@/lib/catalogos/organizacion"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

type EvaluatorAccount = {
  user_id: string
  display_name: string
  email: string
  departamentos: string[] | null
}

type Employee = {
  numero: string
  nombre: string
  puesto: string | null
  departamento: string | null
}

type EmployeeRow = Employee & { tipo_contrato?: string | null }

const EMPLOYEE_COLUMNS = "numero,nombre,puesto,departamento"
const NEW_HIRE_COLUMNS = "numero,nombre,puesto,departamento,tipo_contrato"

function resolveEmployees(plantRows: EmployeeRow[], newHireRows: EmployeeRow[]): Employee[] {
  const plant = new Map(plantRows.filter(row => row.numero).map(row => [row.numero, row]))
  const newHires = new Map(newHireRows.filter(row => row.numero).map(row => [row.numero, row]))
  return [...new Set([...plant.keys(), ...newHires.keys()])]
    .map(number => {
      const hire = newHires.get(number)
      return (hire && hire.tipo_contrato !== "Indeterminado" ? hire : plant.get(number) ?? hire) as Employee
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

async function searchEmployees(term: string): Promise<Employee[]> {
  const pattern = `%${term.replace(/[%_]/g, "")}%`
  const [plantNumber, plantName, hireNumber, hireName] = await Promise.all([
    supabase.from("employees").select(EMPLOYEE_COLUMNS).ilike("numero", pattern).limit(10),
    supabase.from("employees").select(EMPLOYEE_COLUMNS).ilike("nombre", pattern).limit(10),
    supabase.from("nuevo_ingreso").select(NEW_HIRE_COLUMNS).ilike("numero", pattern).limit(10),
    supabase.from("nuevo_ingreso").select(NEW_HIRE_COLUMNS).ilike("nombre", pattern).limit(10),
  ])
  const error = [plantNumber, plantName, hireNumber, hireName].find(result => result.error)?.error
  if (error) throw error
  return resolveEmployees(
    [...(plantNumber.data ?? []), ...(plantName.data ?? [])] as EmployeeRow[],
    [...(hireNumber.data ?? []), ...(hireName.data ?? [])] as EmployeeRow[],
  )
}

async function loadAssignedEmployees(numbers: string[]): Promise<Employee[]> {
  if (!numbers.length) return []
  const plant: EmployeeRow[] = []
  const hires: EmployeeRow[] = []
  for (let offset = 0; offset < numbers.length; offset += 100) {
    const chunk = numbers.slice(offset, offset + 100)
    const [plantResult, hireResult] = await Promise.all([
      supabase.from("employees").select(EMPLOYEE_COLUMNS).in("numero", chunk),
      supabase.from("nuevo_ingreso").select(NEW_HIRE_COLUMNS).in("numero", chunk),
    ])
    if (plantResult.error || hireResult.error) throw plantResult.error ?? hireResult.error
    plant.push(...(plantResult.data ?? []) as EmployeeRow[])
    hires.push(...(hireResult.data ?? []) as EmployeeRow[])
  }
  return resolveEmployees(plant, hires)
}

export default function EvaluatorAssignments() {
  const { canEdit, loading: roleLoading } = useRole()
  const [accounts, setAccounts] = useState<EvaluatorAccount[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [departments, setDepartments] = useState<string[]>([])
  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([])
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Employee[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingNumber, setPendingNumber] = useState<string | null>(null)

  const selectedAccount = accounts.find(account => account.user_id === selectedUserId)
  const departmentOptions = useMemo(
    () => [...new Set([...Object.keys(CATALOGO_ORGANIZACIONAL), ...(selectedAccount?.departamentos ?? [])])].sort((a, b) => a.localeCompare(b, "es")),
    [selectedAccount],
  )
  const assignedSet = useMemo(() => new Set(assignedNumbers), [assignedNumbers])
  const hasDepartmentChanges = JSON.stringify([...departments].sort()) !== JSON.stringify([...(selectedAccount?.departamentos ?? [])].sort())

  useEffect(() => {
    if (roleLoading || !canEdit) return
    let active = true
    supabase.from("profiles")
      .select("user_id,display_name,email,departamentos")
      .eq("role", "evaluador")
      .order("display_name")
      .then(({ data, error }) => {
        if (!active) return
        setLoadingAccounts(false)
        if (error) { notify.error("No se pudieron cargar las cuentas evaluadoras"); return }
        const next = (data ?? []) as EvaluatorAccount[]
        setAccounts(next)
        setSelectedUserId(current => next.some(account => account.user_id === current) ? current : next[0]?.user_id ?? "")
      })
    return () => { active = false }
  }, [canEdit, roleLoading])

  useEffect(() => {
    setDepartments(selectedAccount?.departamentos ?? [])
  }, [selectedAccount])

  useEffect(() => {
    if (!selectedUserId || !canEdit) return
    let active = true
    setLoadingAssignments(true)
    Promise.resolve(supabase.from("evaluator_employee_assignments")
      .select("numero_empleado")
      .eq("evaluator_user_id", selectedUserId)
      .order("numero_empleado"))
      .then(async ({ data, error }) => {
        if (error) throw error
        const numbers = (data ?? []).map(row => row.numero_empleado as string)
        const employees = await loadAssignedEmployees(numbers)
        if (active) {
          setAssignedNumbers(numbers)
          setAssignedEmployees(employees)
        }
      })
      .catch(() => { if (active) notify.error("No se pudieron cargar las personas asignadas") })
      .finally(() => { if (active) setLoadingAssignments(false) })
    return () => { active = false }
  }, [selectedUserId, canEdit])

  useEffect(() => {
    const term = query.trim()
    if (!canEdit || term.length < 2) { setResults([]); setSearching(false); return }
    let active = true
    setSearching(true)
    const timer = window.setTimeout(() => {
      searchEmployees(term)
        .then(employees => { if (active) setResults(employees) })
        .catch(() => { if (active) notify.error("No se pudo buscar empleados") })
        .finally(() => { if (active) setSearching(false) })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query, canEdit])

  const saveDepartments = async () => {
    if (!selectedUserId || !selectedAccount || !hasDepartmentChanges) return
    setSaving(true)
    const { data, error } = await supabase.from("profiles")
      .update({ departamentos: departments })
      .eq("user_id", selectedUserId)
      .eq("role", "evaluador")
      .select("departamentos")
      .single()
    setSaving(false)
    if (error || !data) { notify.error("No se pudieron guardar las áreas"); return }
    setAccounts(current => current.map(account => account.user_id === selectedUserId ? { ...account, departamentos: departments } : account))
    notify.success("Áreas actualizadas")
  }

  const addEmployee = async (employee: Employee) => {
    if (!selectedUserId || assignedSet.has(employee.numero)) return
    setPendingNumber(employee.numero)
    const { error } = await supabase.from("evaluator_employee_assignments")
      .insert({ evaluator_user_id: selectedUserId, numero_empleado: employee.numero })
    setPendingNumber(null)
    if (error) { notify.error("No se pudo asignar a la persona"); return }
    setAssignedNumbers(current => [...current, employee.numero])
    setAssignedEmployees(current => [...current, employee].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")))
    notify.success("Persona asignada")
  }

  const removeEmployee = async (number: string) => {
    if (!selectedUserId) return
    setPendingNumber(number)
    const { error } = await supabase.from("evaluator_employee_assignments")
      .delete().eq("evaluator_user_id", selectedUserId).eq("numero_empleado", number)
    setPendingNumber(null)
    if (error) { notify.error("No se pudo quitar la asignación"); return }
    setAssignedNumbers(current => current.filter(value => value !== number))
    setAssignedEmployees(current => current.filter(employee => employee.numero !== number))
    notify.success("Asignación eliminada")
  }

  if (roleLoading) return <p className="text-sm text-muted-foreground">Verificando acceso…</p>
  if (!canEdit) return <p role="alert" className="text-sm text-muted-foreground">No tienes acceso a las asignaciones.</p>

  return <div className="space-y-5">
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Cuenta evaluadora</CardTitle>
        <p className="text-sm text-muted-foreground">Define las áreas y personas que puede evaluar esta cuenta compartida.</p>
      </CardHeader>
      <CardContent>
        {loadingAccounts ? <p className="text-sm text-muted-foreground">Cargando cuentas…</p> : accounts.length === 0
          ? <p className="text-sm text-muted-foreground">No hay cuentas con rol evaluador.</p>
          : <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={saving || pendingNumber !== null || loadingAssignments}>
              <SelectTrigger aria-label="Cuenta evaluadora" className="w-full sm:max-w-md"><SelectValue /></SelectTrigger>
              <SelectContent>{accounts.map(account => <SelectItem key={account.user_id} value={account.user_id}>{account.display_name || account.email} · {account.email}</SelectItem>)}</SelectContent>
            </Select>}
      </CardContent>
    </Card>

    {selectedAccount && <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Áreas completas</CardTitle>
          <p className="text-sm text-muted-foreground">Incluye a todas las personas del departamento. Desmarca todas para usar solo asignaciones individuales.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {departmentOptions.map(department => <label key={department} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm">
              <Checkbox checked={departments.includes(department)} onCheckedChange={checked => setDepartments(current => checked === true ? [...current, department] : current.filter(value => value !== department))} />
              <span>{department}</span>
            </label>)}
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={saveDepartments} disabled={!hasDepartmentChanges || saving || loadingAssignments || pendingNumber !== null}>
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}Guardar áreas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Personas asignadas</CardTitle>
          <p className="text-sm text-muted-foreground">Se suman a las áreas. Quitar una asignación no excluye a alguien incluido por su departamento.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por número o nombre" aria-label="Buscar empleado para asignar" className="min-h-11 pl-9" />
          </div>
          {query.trim().length >= 2 && <div className="max-h-64 overflow-y-auto rounded-md border border-border">
            {searching ? <p className="p-3 text-sm text-muted-foreground">Buscando…</p> : results.length === 0
              ? <p className="p-3 text-sm text-muted-foreground">Sin coincidencias</p>
              : results.map(employee => <div key={employee.numero} className="flex items-center justify-between gap-3 border-b border-border p-2.5 last:border-b-0">
                  <div className="min-w-0 text-sm"><p className="truncate font-medium">{employee.nombre}</p><p className="truncate text-xs text-muted-foreground">#{employee.numero} · {employee.puesto || employee.departamento || "Sin puesto"}</p></div>
                  <Button type="button" size="sm" variant="outline" disabled={assignedSet.has(employee.numero) || pendingNumber !== null || loadingAssignments} onClick={() => addEmployee(employee)}>
                    <Plus aria-hidden="true" />{assignedSet.has(employee.numero) ? "Asignado" : "Asignar"}
                  </Button>
                </div>)}
          </div>}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{assignedNumbers.length} personas asignadas individualmente</p>
            {loadingAssignments ? <p className="text-sm text-muted-foreground">Cargando asignaciones…</p> : assignedNumbers.length === 0
              ? <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no hay personas asignadas individualmente.</p>
              : assignedNumbers.map(number => {
                  const employee = assignedEmployees.find(item => item.numero === number)
                  return <div key={number} className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3 py-1.5">
                    <div className="min-w-0 text-sm"><p className="truncate font-medium">{employee?.nombre ?? `#${number}`}</p><p className="truncate text-xs text-muted-foreground">#{number}{employee?.puesto ? ` · ${employee.puesto}` : ""}</p></div>
                    <Button type="button" variant="ghost" size="icon" disabled={pendingNumber !== null} onClick={() => removeEmployee(number)} aria-label={`Quitar asignación de ${employee?.nombre ?? number}`}><Trash2 aria-hidden="true" /></Button>
                  </div>
                })}
          </div>
        </CardContent>
      </Card>
    </div>}
  </div>
}
