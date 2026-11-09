"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BadgeCheck, BookPlus, CalendarClock, ChevronDown, EllipsisVertical, FilePenLine, FileText,
  LayoutGrid, Layers, Search, ShieldAlert, Trash2, UserPlus, UserRoundPen, Users, X,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { CATALOGO_ORGANIZACIONAL, TURNOS } from "@/lib/catalogo"
import type { Employee } from "@/lib/hooks"

const PAGE_SIZE = 7
const employeeActionItemClass = "gap-1 px-1 text-sm font-normal"

interface CapHistorialTabProps {
  employees: Employee[]
  loadingEmployees: boolean
  canEdit: boolean
  newEmpSuccess: boolean
  addCoursesSuccess: boolean
  onNewEmployee: () => void
  onBulkImport: () => void
  onBulkImportIncumplimientos: () => void
  onBulkImportActas: () => void
  onBulkCreateEmployees: () => void
  onViewEmployee: (emp: Employee) => void
  onEditEmployee: (emp: Employee) => void
  onAddCourses: (emp: Employee) => void
  onDeleteEmployee: (emp: Employee) => void
}

export function CapHistorialTab({
  employees, loadingEmployees, canEdit,
  newEmpSuccess, addCoursesSuccess,
  onNewEmployee, onBulkImport, onBulkImportIncumplimientos, onBulkImportActas, onBulkCreateEmployees,
  onViewEmployee, onEditEmployee, onAddCourses, onDeleteEmployee,
}: CapHistorialTabProps) {
  const [empSearch, setEmpSearch]         = useState("")
  const [empFilterDept, setEmpFilterDept] = useState("all")
  const [empFilterTurno, setEmpFilterTurno] = useState("all")
  const [empPage, setEmpPage]             = useState(1)

  const filtered = employees
    .filter(e =>
      e.nombre.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.numero ?? '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.departamento ?? '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.puesto ?? '').toLowerCase().includes(empSearch.toLowerCase())
    )
    .filter(e => empFilterDept  === 'all' || (e.departamento ?? '') === empFilterDept)
    .filter(e => empFilterTurno === 'all' || (e.turno ?? '') === empFilterTurno)
    .sort((a, b) => parseInt(b.numero ?? '0', 10) - parseInt(a.numero ?? '0', 10))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(empPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setEmpPage(1) }, [empSearch, empFilterDept, empFilterTurno])

  return (
    <div className="space-y-4">
      {(newEmpSuccess || addCoursesSuccess) && (
        <Alert className="border-success/30 bg-success/10">
          <BadgeCheck className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {newEmpSuccess ? 'Empleado registrado correctamente.' : 'Cursos guardados correctamente.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 pb-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold leading-7 tracking-tight text-foreground">Empleados</h2>
            </div>
            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 min-h-11 px-3 py-0 text-sm font-medium" aria-label="Abrir opciones de carga" title="Abrir opciones de carga">
                    <span>Importar</span>
                    <ChevronDown className="ml-1 size-4" aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="mb-2 px-1">
                    <h3 className="text-sm font-semibold text-foreground">Cargar información</h3>
                  </div>
                  <div className="grid gap-1">
                    <Button variant="ghost" className="min-h-11 justify-start gap-2 px-2" onClick={onBulkImport}>
                      <Layers className="size-4" aria-hidden="true" />
                      Cursos
                    </Button>
                    <Button variant="ghost" className="min-h-11 justify-start gap-2 px-2" onClick={onBulkCreateEmployees}>
                      <Users className="size-4" aria-hidden="true" />
                      Empleados
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" className="min-h-11 justify-start gap-2 px-2" onClick={onBulkImportIncumplimientos}>
                        <ShieldAlert className="size-4" aria-hidden="true" />
                        Incumplimientos
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="ghost" className="min-h-11 justify-start gap-2 px-2" onClick={onBulkImportActas}>
                        <FileText className="size-4" aria-hidden="true" />
                        Actas
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button className="h-11 min-h-11 min-w-11 px-3 py-0 text-sm font-medium" onClick={onNewEmployee} aria-label="Nuevo empleado" title="Nuevo empleado">
                <span className="hidden lg:inline">Nuevo empleado</span>
                <UserPlus className="h-4 w-4 lg:hidden" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                placeholder="Buscar empleado..."
                className={`h-11 pl-9 text-sm ${empSearch ? "pr-11" : ""}`}
              />
              {empSearch && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setEmpSearch("")}
                  className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {/* Filters row */}
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <Select value={empFilterDept} onValueChange={setEmpFilterDept}>
                <SelectTrigger className="h-11 flex-1 text-sm sm:w-48 sm:flex-none">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Departamentos</SelectItem>
                  {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={empFilterTurno} onValueChange={setEmpFilterTurno}>
                <SelectTrigger className="h-11 flex-1 text-sm sm:w-40 sm:flex-none">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Turnos</SelectItem>
                  {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingEmployees ? (
            <div className="overflow-hidden rounded-md border border-border bg-card">
              <div className="divide-y divide-border/60">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-2">
                    <Skeleton className="hidden h-4 w-8 bg-muted sm:block" />
                    <Skeleton className="h-4 flex-1 bg-muted" />
                    <Skeleton className="hidden h-4 w-24 bg-muted sm:block" />
                    <Skeleton className="h-4 w-28 bg-muted" />
                    <Skeleton className="h-4 w-4 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {employees.length === 0
                ? 'Sin empleados registrados. Usa el botón "Nuevo empleado" para agregar.'
                : "No se encontraron empleados con esa búsqueda."}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-md border border-border bg-card">
                <Table className="[&_td]:!py-0">
                  <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent border-border/60">
                      <TableHead className="w-14 hidden sm:table-cell">No.</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Puesto</TableHead>
                      <TableHead className="hidden md:table-cell">Departamento</TableHead>
                      <TableHead className="text-right w-16">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map(emp => (
                      <TableRow key={emp.id} className="hover:bg-muted/30 border-border/60">
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                          {emp.numero ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-ink">
                          <div className="flex flex-col">
                            <span>{emp.nombre}</span>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              {emp.numero ?? ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{emp.puesto ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {emp.departamento && (
                            <span>
                              {emp.departamento}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right p-2">
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={`Más opciones para ${emp.nombre}`}>
                                  <EllipsisVertical className="text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className={employeeActionItemClass} onClick={() => onViewEmployee(emp)}>
                                  <LayoutGrid />
                                  <span>Matriz de capacitación</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className={employeeActionItemClass} onClick={() => onAddCourses(emp)}>
                                  <BookPlus />
                                  <span>Agregar cursos</span>
                                </DropdownMenuItem>
                                {emp.numero && (
                                  <>
                                    <DropdownMenuItem asChild className={employeeActionItemClass}>
                                      <Link href={`/plantilla/incidencias/${encodeURIComponent(emp.numero)}`}>
                                        <CalendarClock />
                                        <span>Incidencias</span>
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className={employeeActionItemClass}>
                                      <Link href={`/plantilla/actas/${encodeURIComponent(emp.numero)}`}>
                                        <FilePenLine />
                                        <span>Actas administrativas</span>
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {emp.numero && (
                                  <DropdownMenuItem asChild className={employeeActionItemClass}>
                                    <Link href={`/plantilla/incumplimientos/${encodeURIComponent(emp.numero)}`}>
                                      <ShieldAlert />
                                      <span>Incumplimiento</span>
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className={employeeActionItemClass} onClick={() => onEditEmployee(emp)}>
                                  <UserRoundPen />
                                  <span>Editar empleado</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteEmployee(emp)} className={`${employeeActionItemClass} text-destructive focus:bg-destructive/10 focus:text-destructive`}>
                                  <Trash2 />
                                  <span>Eliminar</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length > PAGE_SIZE && (
                <div className="mt-4 flex justify-end">
                  <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setEmpPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
