"use client"
import { useState, useEffect } from "react"
import { Search, Plus, ChevronRight, Loader2 } from "lucide-react"
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

  const filtered = positions.filter(p => {
    const matchesDept   = selectedDept === "all" || p.department_id === selectedDept
    const matchesSearch =
      p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      (p.department as any)?.name?.toLowerCase().includes(posSearch.toLowerCase())
    return matchesDept && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(posPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPosPage(1) }, [posSearch, selectedDept])

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Puestos registrados</CardTitle>
            <CardDescription>
              Consulta los puestos y sus cursos requeridos por departamento.
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Button size="sm" className="gap-1.5 shrink-0" onClick={onNewPosition}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo puesto</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={posSearch}
              onChange={e => setPosSearch(e.target.value)}
              className="pl-9 bg-muted text-foreground"
            />
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-full sm:w-56 bg-muted text-foreground">
              <SelectValue placeholder="" />
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
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                          {(pos.department as any)?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm"
                          className="gap-1 text-foreground dark:hover:bg-gray-700"
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
