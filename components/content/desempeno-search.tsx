"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, Printer, Download, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDesempeno } from "@/lib/hooks/useDesempeno"
import { PERIODOS_DESEMPENO, type DesempenoPeriodo } from "@/lib/catalogo"
import { DEFAULT_OBJETIVOS_POR_TIPO, type DesempenoData, type DesempenoTipo } from "@/lib/types/desempeno"
import DesempenoPrint from "./desempeno-print"
import { DesempenoForm } from "./desempeno-form-operativo"

export default function DesempenoSearch() {
  const [numeroBuscado, setNumeroBuscado] = useState("")
  const [tipoSeleccionado, setTipoSeleccionado] = useState<DesempenoTipo>("operativo")
  const [periodoModo, setPeriodoModo] = useState<"semestrales" | "mensuales">("semestrales")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<DesempenoPeriodo>(PERIODOS_DESEMPENO.semestrales[0])
  const { data, loading, error, buscarEmpleado } = useDesempeno()

  useEffect(() => {
    if (data?.tipo && data.tipo !== tipoSeleccionado) {
      setTipoSeleccionado(data.tipo)
    }
  }, [data, tipoSeleccionado])

  useEffect(() => {
    setPeriodoSeleccionado(PERIODOS_DESEMPENO[periodoModo][0])
  }, [periodoModo])

  const handleSearch = () => {
    if (numeroBuscado) buscarEmpleado(numeroBuscado)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-sm text-muted-foreground">Cargando...</div>
    </div>
  )

  const previewData: DesempenoData = data ?? {
    numero_empleado: "",
    nombre: "",
    puesto: "",
    evaluador_nombre: "",
    evaluador_puesto: "",
    tipo: tipoSeleccionado,
    periodo: "PERIODO",
    objetivos: DEFAULT_OBJETIVOS_POR_TIPO[tipoSeleccionado],
    cumplimiento_responsabilidades: [],
    competencias: [],
    compromisos: "",
    fecha_revision: "",
    observaciones: "",
    calificacion_final: 0,
    incidencias: [],
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Buscador */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={numeroBuscado}
                  onChange={(e) => setNumeroBuscado(e.target.value)}
                  placeholder="Buscar por número de empleado ej: 3204"
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["operativo", "administrativo", "jefe"] as DesempenoTipo[]).map((tipo) => (
                  <Button
                    key={tipo}
                    variant={tipoSeleccionado === tipo ? "secondary" : "outline"}
                    onClick={() => setTipoSeleccionado(tipo)}
                  >
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] items-end">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Periodo de evaluación</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["semestrales", "mensuales"] as const).map((modo) => (
                      <Button
                        key={modo}
                        variant={periodoModo === modo ? "secondary" : "outline"}
                        onClick={() => setPeriodoModo(modo)}
                      >
                        {modo === "semestrales" ? "Semestral" : "Mensual"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Seleccionar periodo</label>
                  <Select
                    value={periodoSeleccionado}
                    onValueChange={(value) => setPeriodoSeleccionado(value as DesempenoPeriodo)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODOS_DESEMPENO[periodoModo].map((periodo) => (
                        <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
              <Link href="/desempeno/objetivos">
                <Button variant="outline" className="w-full md:w-auto">
                  Objetivos por puesto
                </Button>
              </Link>
              <Button onClick={handleSearch} className="h-fit w-full md:w-auto">
                Buscar Empleado
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DesempenoForm data={previewData} />

      {data && (
        <>
          <div className="flex gap-2 justify-end">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>

          <div className="print-area hidden print:block">
            <DesempenoPrint data={data} />
          </div>
        </>
      )}
    </div>
  )
}
