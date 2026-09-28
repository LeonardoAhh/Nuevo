"use client"

import { forwardRef } from "react"
import type { ExamenGenerado } from "@/lib/hooks/useGeneradorExamen"
import type { PreguntaExamen } from "@/lib/hooks/useExamenes"
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants/company"
import { generarFolioExamen } from "@/lib/utils"

interface ExamenPrintFormatProps {
  examen: ExamenGenerado
}

const OPCION_LABEL = { a: "A", b: "B", c: "C" } as const

function formatFechaImpresion(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]
  return `${d} de ${meses[m - 1]} de ${y}`
}

/* ── Cabecera con datos del empleado (se repite en cada página) ──────── */
function CabeceraExamen({
  empleado,
  fecha,
  transicion,
  id,
}: {
  empleado: ExamenGenerado["empleado"]
  fecha: string
  transicion: ExamenGenerado["transicion"]
  id?: string
}) {
  return (
    <header className="mb-3">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black tracking-wide uppercase">
            Examen de Conocimientos - Categoría {transicion.categoriaDestino}
          </h1>
          <div className="border-t-2 border-black mt-1 mb-2" />
          <p className="text-base font-bold uppercase leading-tight">{COMPANY_NAME}</p>
          <p className="text-[11px]">{COMPANY_SUBTITLE}</p>
        </div>
      </div>

      <div className="border border-black mt-2 text-[13px]">
        <div className="grid grid-cols-2 border-b border-black">
          <div className="px-2 py-1 border-r border-black">
            <span className="font-bold">Nombre: </span>
            <span className="uppercase">{empleado.nombre}</span>
          </div>
          <div className="px-2 py-1">
            <span className="font-bold">No. Empleado: </span>
            <span>{empleado.numero ?? "—"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-black">
          <div className="px-2 py-1 border-r border-black">
            <span className="font-bold">Departamento: </span>
            <span className="uppercase">{empleado.departamento ?? "—"}</span>
          </div>
          <div className="px-2 py-1">
            <span className="font-bold">Puesto: </span>
            <span className="uppercase">{empleado.puesto ?? "—"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="px-2 py-1 border-r border-black">
            <span className="font-bold">Fecha: </span>
            <span>{formatFechaImpresion(fecha)}</span>
          </div>
          <div className="px-2 py-1">
            <span className="font-bold">Calificación: </span>
            <span className="inline-block w-28 border-b border-black">&nbsp;</span>
          </div>
        </div>
        <div className="border-t border-black px-2 py-2 flex items-end justify-end gap-2">
          <span className="text-[11px] font-bold">Firma del Empleado:</span>
          <span className="inline-block w-48 border-b border-black">&nbsp;</span>
        </div>
      </div>

      <div className="border-t border-black mt-2" />
    </header>
  )
}

const ExamenPrintFormat = forwardRef<HTMLDivElement, ExamenPrintFormatProps>(
  ({ examen }, ref) => {
    const { empleado, preguntas, fecha } = examen

    return (
      <div ref={ref} className="examen-print-root font-sans text-foreground bg-card print:text-black print:bg-white">
        <CabeceraExamen
          empleado={empleado}
          fecha={fecha}
          transicion={examen.transicion}
          id={examen.id}
        />

        {/* Lista continua de preguntas. CSS break-inside-avoid se encarga de la paginación natural */}
        <div className="flex flex-col">
          {preguntas.map((p, i) => (
            <div
              key={p.id}
              className="text-[13px] break-inside-avoid mb-[6px]"
            >
              <p className="font-semibold leading-snug mb-0.5">
                <span className="mr-1">{i + 1}.</span>
                {p.pregunta}
              </p>
              {(["a", "b", "c"] as const).map((op) => (
                <div key={op} className="flex items-start gap-1 ml-3">
                  <span className="inline-flex items-center justify-center w-4 h-4 border border-black rounded-full shrink-0 mt-[1px] text-[11px] font-bold leading-none">
                    {OPCION_LABEL[op]}
                  </span>
                  <span className="leading-snug">
                    {p[`opcion_${op}`]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
ExamenPrintFormat.displayName = "ExamenPrintFormat"
export default ExamenPrintFormat
