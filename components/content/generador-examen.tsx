"use client"

import { useState, useCallback, useRef } from "react"
import {
  Search,
  Loader2,
  FileText,
  Printer,
  RefreshCw,
  User,
  ChevronRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  useGeneradorExamen,
  transicionesDesde,
  extraerCategoria,
} from "@/lib/hooks/useGeneradorExamen"
import ExamenPrintFormat from "./examen-print-format"
import type { EmpleadoBusqueda } from "@/lib/hooks/useGeneradorExamen"

export default function GeneradorExamenContent() {
  const {
    reglas,
    resultados,
    buscando,
    generando,
    examen,
    error,
    buscarEmpleado,
    generarExamen,
    limpiarExamen,
  } = useGeneradorExamen()

  const [searchTerm, setSearchTerm] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [empleadoSeleccionado, setEmpleadoSeleccionado] =
    useState<EmpleadoBusqueda | null>(null)
  const [transicionSeleccionada, setTransicionSeleccionada] = useState<
    string | null
  >(null)

  const printRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) return
    setHasSearched(true)
    buscarEmpleado(searchTerm)
  }, [buscarEmpleado, searchTerm])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleSeleccionarEmpleado = (emp: EmpleadoBusqueda) => {
    setEmpleadoSeleccionado(emp)
    // Auto-detectar la transición según la categoría del puesto
    const cat = extraerCategoria(emp.puesto)
    const transiciones = transicionesDesde(reglas, emp.departamento)
    if (cat && transiciones.length > 0) {
      // Seleccionar la transición que corresponde a la categoría actual
      const match = transiciones.find((t) => t.categoriaActual === cat)
      setTransicionSeleccionada(
        match
          ? `${match.categoriaActual}_${match.categoriaDestino}`
          : `${transiciones[0].categoriaActual}_${transiciones[0].categoriaDestino}`
      )
    } else if (transiciones.length > 0) {
      setTransicionSeleccionada(
        `${transiciones[0].categoriaActual}_${transiciones[0].categoriaDestino}`
      )
    }
  }

  const handleGenerar = async () => {
    if (!empleadoSeleccionado || !transicionSeleccionada) return
    await generarExamen(
      empleadoSeleccionado,
      transicionSeleccionada as "D_C" | "C_B" | "B_A"
    )
  }

  const handleImprimir = () => {
    window.print()
  }

  const handleNuevoExamen = () => {
    limpiarExamen()
    setEmpleadoSeleccionado(null)
    setTransicionSeleccionada(null)
    setSearchTerm("")
    setHasSearched(false)
  }

  const transiciones = empleadoSeleccionado
    ? transicionesDesde(reglas, empleadoSeleccionado.departamento)
    : []

  // ── Si ya existe el examen, mostrar vista de impresión ──────────────────
  if (examen) {
    return (
      <>
        {/* Controles (se ocultan al imprimir) */}
        <div className="no-print px-4 sm:px-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div>
            <p className="font-semibold">{examen.empleado.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {examen.empleado.departamento} · Categoría {examen.transicion.etiqueta} ·{" "}
              {examen.preguntas.length} preguntas
            </p>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" size="icon" onClick={handleNuevoExamen} aria-label="Nuevo examen" title="Nuevo examen">
              <RefreshCw size={14} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                generarExamen(
                  examen.empleado,
                  `${examen.transicion.categoriaActual}_${examen.transicion.categoriaDestino}` as
                    | "D_C"
                    | "C_B"
                    | "B_A"
                )
              }
              disabled={generando}
              aria-label="Regenerar"
              title="Regenerar"
            >
              {generando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </Button>
            <Button size="icon" onClick={handleImprimir} aria-label="Imprimir" title="Imprimir">
              <Printer size={14} />
            </Button>
          </div>
        </div>

        {/* Hoja de examen — visible en pantalla y se imprime */}
        <div className="px-4 sm:px-6 pb-6">
          <div
            className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm print-area print:bg-white print:border-gray-200"
            ref={printRef}
          >
            <ExamenPrintFormat examen={examen} />
          </div>
        </div>
      </>
    )
  }

  // ── Pantalla de búsqueda / configuración ────────────────────────────────
  return (
    <div className="px-4 sm:px-6 pb-6 space-y-6">
      {/* Paso 1: buscar empleado */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          1. Buscar empleado
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nombre o número de empleado..."
              className={`pl-9 ${searchTerm ? "pr-9" : ""}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setHasSearched(false)
                  setEmpleadoSeleccionado(null)
                  buscarEmpleado("")
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={buscando || !searchTerm.trim()}
            aria-label="Buscar empleado"
          >
            {buscando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {resultados.length > 0 && !empleadoSeleccionado && (
        <Card>
          <CardContent className="p-0 divide-y">
            {resultados.map((emp) => {
              const cat = extraerCategoria(emp.puesto)
              return (
                <button
                  key={emp.id}
                  onClick={() => handleSeleccionarEmpleado(emp)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 focus-visible:outline-none focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                    <User size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {emp.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.departamento ?? "—"} · {emp.puesto ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cat && (
                      <Badge variant="secondary" className="text-xs">
                        Cat. {cat}
                      </Badge>
                    )}
                    {emp.numero && (
                      <span className="text-xs text-muted-foreground">
                        #{emp.numero}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Empleado seleccionado */}
      {empleadoSeleccionado && (
        <>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{empleadoSeleccionado.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {empleadoSeleccionado.departamento ?? "—"} ·{" "}
                  {empleadoSeleccionado.puesto ?? "—"}
                  {empleadoSeleccionado.numero && (
                    <> · <strong>#{empleadoSeleccionado.numero}</strong></>
                  )}
                </p>
              </div>
              <button
                onClick={() => setEmpleadoSeleccionado(null)}
                aria-label="Quitar empleado seleccionado"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={16} />
              </button>
            </CardContent>
          </Card>

          {/* Paso 2: seleccionar transición */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              2. Tipo de examen (categoría)
            </p>
            {transiciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay reglas de examen configuradas para este departamento.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {transiciones.map((t) => {
                  const key = `${t.categoriaActual}_${t.categoriaDestino}`
                  const isAuto =
                    extraerCategoria(empleadoSeleccionado.puesto) ===
                    t.categoriaActual
                  const selected = transicionSeleccionada === key
                  return (
                    <button
                      key={key}
                      onClick={() => setTransicionSeleccionada(key)}
                      aria-pressed={selected}
                      className={`rounded-lg border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg">
                          {t.etiqueta}
                        </span>
                        {isAuto && (
                          <Badge className="text-[10px] py-0 h-4">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t.numPreguntas} preguntas aleatorias
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Paso 3: generar */}
          {transicionSeleccionada && (
            <Button
              size="icon"
              onClick={handleGenerar}
              disabled={generando}
              aria-label="Generar Examen"
              title="Generar Examen"
            >
              {generando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
            </Button>
          )}
        </>
      )}

      {/* Estado vacío: antes de buscar vs sin resultados */}
      {resultados.length === 0 && !buscando && !empleadoSeleccionado && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Generador de Exámenes</p>
          <p className="text-sm mt-1 text-center max-w-xs">
            Busca un empleado por nombre o número para generar su examen de
            promoción con preguntas aleatorias de su departamento.
          </p>
        </div>
      )}
      {resultados.length === 0 && !buscando && !empleadoSeleccionado && hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search size={40} className="mb-3 opacity-30" />
          <p className="text-base font-medium">Sin resultados</p>
          <p className="text-sm mt-1 text-center max-w-xs">
            No encontramos empleados para &quot;{searchTerm}&quot;. Revisa el nombre o número e intenta de nuevo.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
