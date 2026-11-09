import { Filter, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function RecontratacionFilters({
  search,
  onSearchChange,
  searchId,
  departments,
  filterDepartment,
  onDepartmentChange,
  hasFilters,
  onClear,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchId: string
  departments: string[]
  filterDepartment: string
  onDepartmentChange: (value: string) => void
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3" role="search" aria-label="Filtros de empleados">
      <div className="relative min-w-0 flex-1 basis-full md:basis-auto">
        <label htmlFor={searchId} className="sr-only">
          Buscar empleado
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={searchId}
          placeholder="Nombre, número, puesto…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-11 bg-card pl-10 pr-12 text-sm"
        />
        {search && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => onSearchChange("")}
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <Select value={filterDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger
          className="h-11 w-full gap-2 bg-card text-sm md:w-48"
          aria-label="Filtrar por departamento"
        >
          <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Departamentos</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department} value={department}>{department}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 gap-2 px-3 py-0 text-sm md:ml-auto"
          onClick={onClear}
          aria-label="Limpiar todos los filtros"
        >
          <X className="size-4" aria-hidden="true" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
