"use client"

import { forwardRef } from "react"
import type { ExamenGenerado } from "@/lib/hooks/useGeneradorExamen"
import type { PreguntaExamen } from "@/lib/hooks/useExamenes"

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

const ExamenPrintFormat = forwardRef<HTMLDivElement, ExamenPrintFormatProps>(
  ({ examen }, ref) => {
    const { empleado, transicion, preguntas, fecha } = examen

    // Split preguntas en dos columnas para ahorrar espacio en hoja carta
    const mitad = Math.ceil(preguntas.length / 2)
    const col1 = preguntas.slice(0, mitad)
    const col2 = preguntas.slice(mitad)

    return (
      <div ref={ref} className="examen-print-root font-sans text-black bg-white">
        {/* ── CABECERA ─────────────────────────────────────────────────────── */}
        <header className="mb-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black tracking-wide uppercase">
                Examen de Conocimientos
              </h1>
              <div className="border-t-2 border-black mt-1 mb-2" />
              <p className="text-base font-bold uppercase leading-tight">Viñoplastic</p>
              <p className="text-[11px]">Ingeniería en Plásticos</p>
            </div>
            <div className="text-right">
              <div className="border-b border-black w-44 mb-1" />
              <p className="text-[11px]">Firma del Empleado</p>
            </div>
          </div>

          {/* Datos del empleado */}
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
          </div>

          <div className="border-t border-black mt-2" />
        </header>

        {/* ── PREGUNTAS EN DOS COLUMNAS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-5">
          <PreguntaColumna preguntas={col1} inicio={1} />
          <PreguntaColumna preguntas={col2} inicio={mitad + 1} />
        </div>


      </div>
    )
  }
)
ExamenPrintFormat.displayName = "ExamenPrintFormat"
export default ExamenPrintFormat

// ─────────────────────────────────────────────────────────────────────────────

function PreguntaColumna({
  preguntas,
  inicio,
}: {
  preguntas: PreguntaExamen[]
  inicio: number
}) {
  return (
    <div className="flex flex-col gap-2">
      {preguntas.map((p, i) => (
        <div key={p.id} className="text-[13px] break-inside-avoid">
          <p className="font-semibold leading-snug mb-0.5">
            <span className="mr-1">{inicio + i}.</span>
            {p.pregunta}
          </p>
          {(["a", "b", "c"] as const).map((op) => (
            <div key={op} className="flex items-start gap-1 ml-3">
              {/* Burbuja para marcar */}
              <span className="inline-flex items-center justify-center w-4 h-4 border border-black rounded-full shrink-0 mt-[1px] text-[11px] font-bold leading-none">
                {OPCION_LABEL[op]}
              </span>
              <span className="leading-snug">{p[`opcion_${op}`]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
