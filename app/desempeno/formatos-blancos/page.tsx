// TODO: ELIMINAR — página temporal para imprimir formatos en blanco
"use client"

import { useEffect } from "react"
import DesempenoPrint from "@/components/content/desempeno-print"
import {
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_CUMPLIMIENTO_POR_TIPO,
  DEFAULT_COMPETENCIAS,
  type DesempenoData,
} from "@/lib/types/desempeno"

// ── Datos en blanco ───────────────────────────────────────────────────────────
const emptyObj = (n: number) => ({
  numero: n,
  descripcion: "",
  resultado: "NA",
  porcentaje: "NA",
  comentarios: "",
})

const BLANK_OPERATIVO: DesempenoData = {
  numero_empleado: "", nombre: "", puesto: "",
  evaluador_nombre: "", evaluador_puesto: "", periodo: "",
  tipo: "operativo",
  objetivos: Array.from({ length: 5 }, (_, i) => emptyObj(i + 1)),
  cumplimiento_responsabilidades: (DEFAULT_CUMPLIMIENTO_POR_TIPO["operativo"] ?? DEFAULT_CUMPLIMIENTO).map(c => ({ ...c })),
  competencias: DEFAULT_COMPETENCIAS.map(c => ({ ...c, calificacion: 4 })),
  compromisos: "", fecha_revision: "", observaciones: "",
  calificacion_final: 100, incidencias: [],
}

const BLANK_ADMIN: DesempenoData = {
  numero_empleado: "", nombre: "", puesto: "",
  evaluador_nombre: "", evaluador_puesto: "", periodo: "",
  tipo: "administrativo",
  objetivos: Array.from({ length: 7 }, (_, i) => emptyObj(i + 1)),
  cumplimiento_responsabilidades: (DEFAULT_CUMPLIMIENTO_POR_TIPO["administrativo"] ?? DEFAULT_CUMPLIMIENTO).map(c => ({ ...c })),
  competencias: DEFAULT_COMPETENCIAS.map(c => ({ ...c, calificacion: 4 })),
  compromisos: "", fecha_revision: "", observaciones: "",
  calificacion_final: 100, incidencias: [],
}

const BLANK_JEFE: DesempenoData = {
  numero_empleado: "", nombre: "", puesto: "",
  evaluador_nombre: "", evaluador_puesto: "", periodo: "",
  tipo: "jefe",
  objetivos: Array.from({ length: 7 }, (_, i) => emptyObj(i + 1)),
  cumplimiento_responsabilidades: (DEFAULT_CUMPLIMIENTO_POR_TIPO["jefe"] ?? DEFAULT_CUMPLIMIENTO).map(c => ({ ...c })),
  competencias: DEFAULT_COMPETENCIAS.map(c => ({ ...c, calificacion: 4 })),
  compromisos: "", fecha_revision: "", observaciones: "",
  calificacion_final: 100, incidencias: [],
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function FormatosBlancos() {
  // Dispara el diálogo de impresión automáticamente al cargar
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Botón de respaldo visible solo en pantalla */}
      <div className="no-print flex gap-3 p-4 bg-muted text-sm">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Imprimir formatos
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>

      {/* Formato 1 — Operativo */}
      <div className="print-area">
        <DesempenoPrint data={BLANK_OPERATIVO} />
      </div>

      {/* Separador de página entre formatos */}
      <div style={{ pageBreakBefore: "always" }} />

      {/* Formato 2 — Administrativo */}
      <div className="print-area">
        <DesempenoPrint data={BLANK_ADMIN} />
      </div>

      {/* Separador de página entre formatos */}
      <div style={{ pageBreakBefore: "always" }} />

      {/* Formato 3 — Jefe */}
      <div className="print-area">
        <DesempenoPrint data={BLANK_JEFE} />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { display: block !important; visibility: visible !important; }
        }
        @media screen {
          .print-area { max-width: 210mm; margin: 0 auto; padding: 8mm; }
        }
      `}</style>
    </>
  )
}
