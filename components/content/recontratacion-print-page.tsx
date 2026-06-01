"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import RecontratacionPrint, { type RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"
import { useRole } from "@/lib/hooks"

export default function RecontratacionPrintPage() {
  const params = useSearchParams()
  const numero = params.get("numero") ?? ""
  const { fetchByNumero } = useRecontratacion()
  const { isEvaluador, loading: roleLoading } = useRole()

  const [data, setData] = useState<RecontratacionPrintData | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading")

  useEffect(() => {
    if (roleLoading || isEvaluador) return
    if (!numero) { setStatus("notfound"); return }
    let cancelled = false
    fetchByNumero(numero).then(d => {
      if (cancelled) return
      if (!d) { setStatus("notfound"); return }
      setData(d)
      setStatus("ready")
    })
    return () => { cancelled = true }
  }, [numero, fetchByNumero, roleLoading, isEvaluador])

  // Dispara el diálogo de impresión cuando el documento está listo.
  useEffect(() => {
    if (status !== "ready") return
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [status])

  if (!roleLoading && isEvaluador) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No tienes permiso para acceder a este formato.
      </div>
    )
  }

  return (
    <>
      <div className="no-print flex gap-3 p-4 bg-muted text-sm">
        <button
          onClick={() => window.print()}
          disabled={status !== "ready"}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Imprimir formato
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>

      {status === "loading" && (
        <div className="no-print p-8 text-center text-sm text-muted-foreground">Cargando formato…</div>
      )}
      {status === "notfound" && (
        <div className="no-print p-8 text-center text-sm text-muted-foreground">
          No se encontró el registro de nuevo ingreso (número: {numero || "—"}).
        </div>
      )}

      {data && <RecontratacionPrint data={data} />}

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
        @media screen {
          .print-area { max-width: 210mm; margin: 0 auto; padding: 8mm; box-shadow: 0 0 0 1px hsl(var(--border)); }
        }
      `}</style>
    </>
  )
}
