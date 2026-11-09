"use client"
import { useState, useEffect } from "react"
import { Search, Plus, X, BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { Department, Position } from "@/lib/hooks"

const PAGE_SIZE = 5

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
    <div className="bg-card border border-border/60 shadow-none rounded-xl overflow-hidden">
      <div className="pb-6 pt-6 px-6 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold leading-7 tracking-tight text-foreground">Puestos registrados</h2>
          </div>
          {!isReadOnly && (
            <Button onClick={onNewPosition} className="h-11 min-h-11 px-3 py-0 text-sm font-medium" aria-label="Nuevo puesto" title="Nuevo puesto">
              <span className="hidden sm:inline">Nuevo puesto</span>
              <Plus className="h-4 w-4 sm:hidden" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={posSearch}
              onChange={e => setPosSearch(e.target.value)}
              placeholder="Buscar puesto..."
              className={`h-11 pl-9 text-sm ${posSearch ? "pr-11" : ""}`}
            />
            {posSearch && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setPosSearch("")}
                className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-11 flex-1 text-sm sm:w-48 sm:flex-none">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Departamentos</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingPositions ? (
          <div className="rounded-md border border-border/60 overflow-hidden bg-transparent shadow-none">
            <div className="divide-y divide-border/60">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 flex-1 bg-muted" />
                  <Skeleton className="h-4 w-32 hidden sm:block bg-muted" />
                  <Skeleton className="h-8 w-24 rounded-md bg-muted" />
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
            <div className="rounded-md border border-border/60 shadow-none overflow-hidden bg-transparent">
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent hover:bg-transparent border-border/60">
                    <TableHead>Puesto</TableHead>
                    <TableHead className="hidden sm:table-cell">Departamento</TableHead>
                    <TableHead className="text-center w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(pos => (
                    <TableRow key={pos.id} className="hover:bg-muted/30 border-border/60">
                      <TableCell className="text-sm font-medium text-ink">{pos.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground font-normal">
                        <span>{getDeptName(pos) ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <Button
                          variant="ghost" size="sm"
                          className="mx-auto h-11 min-h-11 px-3 py-0 text-sm"
                          onClick={() => onViewCourses(pos)}
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Ver</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > PAGE_SIZE && (
              <div className="mt-4 flex justify-end">
                <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setPosPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
