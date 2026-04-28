"use client"
import { useState, useEffect } from "react"
import { Search, Plus, ChevronRight, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { Department, Position } from "@/lib/hooks"

const PAGE_SIZE = 15

interface CapPositionsTabProps {
  departments: Department[]
  positions: Position[]
  loadingPositions: boolean
  isReadOnly: boolean
  onNewPosition: () => void
  onViewCourses: (pos: Position) => void
}

export function CapPositionsTab({
  departments, positions, loadingPositions, isReadOnly, onNewPosition, onViewCourses,
}: CapPositionsTabProps) {
  const [posSearch, setPosSearch]     = useState("")
  const [selectedDept, setSelectedDept] = useState("all")
  const [posPage, setPosPage]         = useState(1)

  const getDeptName = (p: Position): string | undefined =>
    (p.department as { name?: string } | null | undefined)?.name
  const filtered = positions.filter(p => {
    const matchesDept   = selectedDept === "all" || p.department_id === selectedDept
    const matchesSearch =
      p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      (getDeptName(p) ?? "").toLowerCase().includes(posSearch.toLowerCase())
    return matchesDept && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(posPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPosPage(1) }, [posSearch, selectedDept])

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle>Puestos registrados</CardTitle>
            <CardDescription>
              Consulta los puestos y sus cursos requeridos por departamento.
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Button size="icon" onClick={onNewPosition} aria-label="Nuevo puesto" title="Nuevo puesto">
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + dept filter — single row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={posSearch}
              onChange={e => setPosSearch(e.target.value)}
              className={`pl-9 bg-muted text-foreground ${posSearch ? "pr-9" : ""}`}
            />
            {posSearch && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setPosSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-36 shrink-0 bg-muted text-foreground text-sm">
              <SelectValue placeholder="Depto." />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">Departamentos</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingPositions ? (
          <div className="rounded-xl border overflow-hidden">
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {positions.length === 0
              ? "No hay puestos cargados. Usa la pestaña Importar para cargar datos."
              : "No se encontraron puestos con ese filtro."}
          </div>
        ) : (
          <>
            {filtered.length > PAGE_SIZE && (
              <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setPosPage} />
            )}
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/50">
                    <TableHead>Puesto</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(pos => (
                    <TableRow key={pos.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{pos.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-muted text-foreground">
                          {getDeptName(pos) ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm"
                          className="gap-1 text-foreground hover:bg-muted"
                          onClick={() => onViewCourses(pos)}
                        >
                          Ver cursos <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {positions.length} puestos
        </p>
      </CardContent>
    </Card>
  )
}
