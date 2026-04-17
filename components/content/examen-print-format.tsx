"use client"

import { forwardRef } from "react"
import type { ExamenGenerado } from "@/lib/hooks/useGeneradorExamen"
import type { PreguntaExamen } from "@/lib/hooks/useExamenes"
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants/company"

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
}: {
  empleado: ExamenGenerado["empleado"]
  fecha: string
}) {
  return (
    <header className="mb-3">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black tracking-wide uppercase">
            Examen de Conocimientos
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

/* ── Máximo de preguntas por página (1 columna, hoja carta con cabecera) */
const PREGUNTAS_POR_PAGINA = 7

const ExamenPrintFormat = forwardRef<HTMLDivElement, ExamenPrintFormatProps>(
  ({ examen }, ref) => {
    const { empleado, preguntas, fecha } = examen

    // Dividir preguntas en páginas para evitar desborde
    const paginas: PreguntaExamen[][] = []
    for (let i = 0; i < preguntas.length; i += PREGUNTAS_POR_PAGINA) {
      paginas.push(preguntas.slice(i, i + PREGUNTAS_POR_PAGINA))
    }

    return (
      <div ref={ref} className="examen-print-root font-sans text-foreground bg-card print:text-black print:bg-white">
        {paginas.map((pagPreguntas, pIdx) => {
          const inicio = pIdx * PREGUNTAS_POR_PAGINA + 1
          return (
            <div
              key={pIdx}
              className={`examen-pagina ${pIdx > 0 ? "break-before-page" : ""}`}
            >
              {pIdx === 0 && (
                <CabeceraExamen
                  empleado={empleado}
                  fecha={fecha}
                />
              )}

              {/* Preguntas en 1 columna */}
              <div className="flex flex-col">
                {pagPreguntas.map((p, i) => (
                  <div
                    key={p.id}
                    className="text-[13px] break-inside-avoid mb-[6px]"
                  >
                    <p className="font-semibold leading-snug mb-0.5">
                      <span className="mr-1">{inicio + i}.</span>
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
        })}

        {/* ── HOJA DE RESPUESTAS (última página) ────────────────────────── */}
        <div className="examen-pagina break-before-page">
          <h2 className="text-base font-bold uppercase tracking-wide mb-3 text-center">
            Hoja de Respuestas
          </h2>
          <div className="flex flex-col">
            {preguntas.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 text-[13px] mb-1 break-inside-avoid"
              >
                <span className="font-semibold w-6 text-right shrink-0">
                  {i + 1}.
                </span>
                {(["a", "b", "c"] as const).map((op) => (
                  <span
                    key={op}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-bold leading-none ${
                      p.respuesta_correcta === op
                        ? "border-foreground bg-foreground text-background print:border-black print:bg-black print:text-white"
                        : "border-muted-foreground/40 text-muted-foreground/40 print:border-gray-400 print:text-gray-400"
                    }`}
                  >
                    {OPCION_LABEL[op]}
                  </span>
                ))}
                <span className="text-[11px] text-muted-foreground/40 truncate ml-1 print:text-gray-400">
                  {p.pregunta.length > 50
                    ? p.pregunta.slice(0, 50) + "…"
                    : p.pregunta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
ExamenPrintFormat.displayName = "ExamenPrintFormat"
export default ExamenPrintFormat
