"use client"
import { useState, useEffect } from "react"
import { Search, BookOpen, ChevronRight, Pencil, Trash2, UserPlus, Layers, CheckCircle2, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { CATALOGO_ORGANIZACIONAL, TURNOS } from "@/lib/catalogo"
import type { Employee } from "@/lib/hooks"

const PAGE_SIZE = 15

interface CapHistorialTabProps {
  employees: Employee[]
  loadingEmployees: boolean
  progressMap: Record<string, { aprobados: number; reprobados: number; total: number }>
  isReadOnly: boolean
  newEmpSuccess: boolean
  addCoursesSuccess: boolean
  onNewEmployee: () => void
  onBulkImport: () => void
  onViewEmployee: (emp: Employee) => void
  onEditEmployee: (emp: Employee) => void
  onAddCourses: (emp: Employee) => void
  onDeleteEmployee: (emp: Employee) => void
}

export function CapHistorialTab({
  employees, loadingEmployees, progressMap, isReadOnly,
  newEmpSuccess, addCoursesSuccess,
  onNewEmployee, onBulkImport,
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
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {newEmpSuccess ? 'Empleado registrado correctamente.' : 'Cursos guardados correctamente.'}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle>Empleados</CardTitle>
              <CardDescription>Registro de cursos tomados por empleado.</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="icon" variant="outline" onClick={onBulkImport} aria-label="Carga masiva" title="Carga masiva">
                <Layers className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={onNewEmployee} aria-label="Nuevo empleado" title="Nuevo empleado">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                placeholder="Buscar empleado..."
                className={`pl-9 bg-muted text-foreground ${empSearch ? "pr-9" : ""}`}
              />
              {empSearch && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setEmpSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Filters row */}
            <div className="flex items-center gap-2">
              <Select value={empFilterDept} onValueChange={setEmpFilterDept}>
                <SelectTrigger className="flex-1 sm:w-44 sm:flex-none bg-muted text-foreground text-sm">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">Departamentos</SelectItem>
                  {Object.keys(CATALOGO_ORGANIZACIONAL).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={empFilterTurno} onValueChange={setEmpFilterTurno}>
                <SelectTrigger className="flex-1 sm:w-36 sm:flex-none bg-muted text-foreground text-sm">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">Turnos</SelectItem>
                  {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingEmployees ? (
            <div className="rounded-xl border overflow-hidden">
              <div className="divide-y">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-4 w-8 hidden sm:block" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24 hidden sm:block" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded" />
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
              {filtered.length > PAGE_SIZE && (
                <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setEmpPage} />
              )}
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
                    {paginated.map(emp => (
                      <TableRow key={emp.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm text-muted-foreground font-mono hidden sm:table-cell">
                          {emp.numero ?? "—"}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col">
                            <span>{emp.nombre}</span>
                            <span className="text-xs text-muted-foreground font-mono sm:hidden">
                              {emp.numero ?? ""}
                            </span>
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
                        <TableCell className="hidden sm:table-cell w-32">
                          {(() => {
                            const p = progressMap[emp.id]
                            if (!p || p.total === 0) return null
                            const pct = Math.round((p.aprobados / p.total) * 100)
                            return (
                              <div className="flex items-center gap-2">
                                <div className="flex h-1.5 flex-1 rounded-full overflow-hidden bg-muted">
                                  {p.aprobados > 0 && (
                                    <div className="bg-success transition-all" style={{ width: `${(p.aprobados / p.total) * 100}%` }} />
                                  )}
                                  {p.reprobados > 0 && (
                                    <div className="bg-destructive transition-all" style={{ width: `${(p.reprobados / p.total) * 100}%` }} />
                                  )}
                                </div>
                                <span className="text-[11px] tabular-nums text-muted-foreground w-7 text-right">
                                  {pct}%
                                </span>
                              </div>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right p-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline" size="icon"
                              className="h-9 w-9 text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => onAddCourses(emp)}
                              title="Agregar cursos"
                              aria-label={`Agregar cursos a ${emp.nombre}`}
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-9 w-9 p-0 text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => onEditEmployee(emp)}
                              title="Editar"
                              aria-label={`Editar ${emp.nombre}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-9 w-9 p-0 text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => onViewEmployee(emp)}
                              title="Ver detalle"
                              aria-label={`Ver detalle de ${emp.nombre}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => onDeleteEmployee(emp)}
                              title="Eliminar"
                              aria-label={`Eliminar ${emp.nombre}`}
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
            </>
          )}
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {employees.length} empleados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
