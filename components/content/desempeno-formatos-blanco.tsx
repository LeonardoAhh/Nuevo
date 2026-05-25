"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DesempenoPrint from "./desempeno-print"
import {
  DEFAULT_OBJETIVOS_POR_TIPO,
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_COMPETENCIAS,
  type DesempenoData,
  type DesempenoTipo,
} from "@/lib/types/desempeno"

const FORMATOS: { tipo: DesempenoTipo; label: string }[] = [
  { tipo: "operativo", label: "Personal Operativo" },
  { tipo: "administrativo", label: "Personal Administrativo / Jefes" },
]

function buildBlankData(tipo: DesempenoTipo): DesempenoData {
  return {
    numero_empleado: "",
    nombre: "",
    puesto: "",
    evaluador_nombre: "",
    evaluador_puesto: "",
    tipo,
    periodo: "",
    objetivos: DEFAULT_OBJETIVOS_POR_TIPO[tipo].map((o) => ({
      ...o,
      descripcion: "",
      resultado: "NA",
      porcentaje: "NA",
      comentarios: "",
    })),
    cumplimiento_responsabilidades: DEFAULT_CUMPLIMIENTO.map((c) => ({
      ...c,
      porcentaje: "",
      comentarios: "",
    })),
    competencias: DEFAULT_COMPETENCIAS.map((c) => ({
      ...c,
      calificacion: 0,
      comentarios: "",
    })),
    compromisos: "",
    fecha_revision: "",
    observaciones: "",
    calificacion_final: 0,
    incidencias: [],
  }
}

export default function FormatosBlanco() {
  const [selected, setSelected] = useState<DesempenoTipo>("operativo")

  const data = buildBlankData(selected)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seleccionar formato</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {FORMATOS.map(({ tipo, label }) => (
            <Button
              key={tipo}
              variant={selected === tipo ? "default" : "outline"}
              size="sm"
              onClick={() => setSelected(tipo)}
            >
              {label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </CardContent>
      </Card>

      {/* Preview visible on screen, printable */}
      <Card className="overflow-auto">
        <CardContent className="p-4">
          <div className="print-area">
            <DesempenoPrint data={data} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
