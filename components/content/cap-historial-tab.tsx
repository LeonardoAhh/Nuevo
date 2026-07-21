"use client"
import { useState, useEffect } from "react"
import { Search, BookOpen, ChevronRight, Pencil, Trash2, UserPlus, Layers, Users, CheckCircle2, X, CalendarDays, FileWarning, MoreVertical, GraduationCap } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { CATALOGO_ORGANIZACIONAL, TURNOS } from "@/lib/catalogo"
import type { Employee } from "@/lib/hooks"

const PAGE_SIZE = 10

interface CapHistorialTabProps {
  employees: Employee[]
  loadingEmployees: boolean
  isReadOnly: boolean
  newEmpSuccess: boolean
  addCoursesSuccess: boolean
  onNewEmployee: () => void
  onBulkImport: () => void
  onBulkCreateEmployees: () => void
  onViewEmployee: (emp: Employee) => void
  onEditEmployee: (emp: Employee) => void
  onAddCourses: (emp: Employee) => void
  onDeleteEmployee: (emp: Employee) => void
  onIncidencias: (emp: Employee) => void
  onActasSeguimiento: (emp: Employee) => void
}

export function CapHistorialTab({
  employees, loadingEmployees, isReadOnly,
  newEmpSuccess, addCoursesSuccess,
  onNewEmployee, onBulkImport, onBulkCreateEmployees,
  onViewEmployee, onEditEmployee, onAddCourses, onDeleteEmployee, onIncidencias,
  onActasSeguimiento,
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
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {newEmpSuccess ? 'Empleado registrado correctamente.' : 'Cursos guardados correctamente.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card border border-border/60 shadow-none rounded-xl overflow-hidden">
        <div className="pb-6 pt-6 px-6 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-normal tracking-[-0.02em] text-ink">Empleados</h2>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button className="h-10 px-4 rounded-md bg-card border border-border/60 hover:bg-muted/30 text-ink shadow-none font-medium transition-colors" onClick={onBulkImport} aria-label="Cargar cursos" title="Cargar cursos">
                <span className="hidden sm:inline">Cargar cursos</span>
                <Layers className="h-4 w-4 sm:hidden" />
              </Button>
              <Button className="h-10 px-4 rounded-md bg-card border border-border/60 hover:bg-muted/30 text-ink shadow-none font-medium transition-colors" onClick={onBulkCreateEmployees} aria-label="Cargar empleados" title="Cargar empleados">
                <span className="hidden sm:inline">Cargar empleados</span>
                <Users className="h-4 w-4 sm:hidden" />
              </Button>
              <Button className="h-10 px-4 rounded-md shadow-none font-medium transition-colors" onClick={onNewEmployee} aria-label="Nuevo empleado" title="Nuevo empleado">
                <span className="hidden sm:inline">Nuevo empleado</span>
                <UserPlus className="h-4 w-4 sm:hidden" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
              <Input
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                placeholder="Buscar empleado..."
                className={`pl-11 h-11 rounded-md border-border/60 bg-transparent shadow-none text-ink text-base focus-visible:ring-1 focus-visible:ring-primary ${empSearch ? "pr-11" : ""}`}
              />
              {empSearch && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setEmpSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>
            {/* Filters row */}
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <Select value={empFilterDept} onValueChange={setEmpFilterDept}>
                <SelectTrigger className="h-11 flex-1 sm:w-48 sm:flex-none rounded-md border-border/60 bg-transparent shadow-none text-ink text-base">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-border/60 shadow-sm bg-card">
                  <SelectItem value="all">Departamentos</SelectItem>
                  {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={empFilterTurno} onValueChange={setEmpFilterTurno}>
                <SelectTrigger className="h-11 flex-1 sm:w-40 sm:flex-none rounded-md border-border/60 bg-transparent shadow-none text-ink text-base">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-border/60 shadow-sm bg-card">
                  <SelectItem value="all">Turnos</SelectItem>
                  {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingEmployees ? (
            <div className="rounded-md border border-border/60 shadow-none overflow-hidden bg-transparent">
              <div className="divide-y divide-border/60">
                {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-8 hidden sm:block bg-muted" />
                  <Skeleton className="h-4 flex-1 bg-muted" />
                  <Skeleton className="h-4 w-24 hidden sm:block bg-muted" />
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
              <div className="rounded-md border border-border/60 shadow-none overflow-hidden bg-transparent">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent border-border/60">
                      <TableHead className="w-14 hidden sm:table-cell">No.</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Puesto</TableHead>
                      <TableHead className="hidden md:table-cell">Departamento</TableHead>
                      <TableHead className="text-center w-28">Matriz</TableHead>
                      <TableHead className="text-right w-16">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map(emp => (
                      <TableRow key={emp.id} className="hover:bg-muted/30 border-border/60">
                        <TableCell className="text-sm text-muted-foreground font-mono hidden sm:table-cell">
                          {emp.numero ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-ink">
                          <div className="flex flex-col">
                            <span>{emp.nombre}</span>
                            <span className="text-xs text-muted-foreground font-mono sm:hidden">
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
                        <TableCell className="text-center p-2">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 mx-auto text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            onClick={() => onViewEmployee(emp)}
                            title="Ver matriz de capacitación"
                          >
                            <GraduationCap className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right p-2">
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" title="Más opciones">
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onAddCourses(emp)} className="cursor-pointer">
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  <span>Agregar cursos</span>
                                </DropdownMenuItem>
                                {emp.numero && (
                                  <>
                                    <DropdownMenuItem onClick={() => onIncidencias(emp)} className="cursor-pointer">
                                      <CalendarDays className="mr-2 h-4 w-4 text-info" />
                                      <span>Incidencias</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onActasSeguimiento(emp)} className="cursor-pointer">
                                      <FileWarning className="mr-2 h-4 w-4 text-destructive/70" />
                                      <span>Actas y Seguimiento</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEditEmployee(emp)} className="cursor-pointer">
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>Editar empleado</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteEmployee(emp)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
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
