"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Lock, Printer, X, Loader2, FileX2 } from "lucide-react"
import RecontratacionPrint, { type RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"
import { useRole } from "@/lib/hooks"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function RecontratacionPrintPage() {
  const params = useSearchParams()
  const numero = params.get("numero") ?? ""
  const { fetchByNumero } = useRecontratacion()
  const { isEvaluador, loading: roleLoading } = useRole()
  const [data, setData] = useState<RecontratacionPrintData | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading")
  const [mostrarObservacion, setMostrarObservacion] = useState(true)

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

  useEffect(() => {
    if (status !== "ready") return
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [status])

  if (!roleLoading && isEvaluador) {
    return (
      <div className="no-print min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-card border border-border rounded-lg px-8 py-8 text-center max-w-sm shadow-sm">
          <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground m-0">
            No tienes permiso para acceder a este formato.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Barra de herramientas — solo pantalla */}
      <div className="no-print sticky top-0 z-50 flex items-center gap-2 px-4 py-2.5 bg-foreground border-b border-border shadow-sm">
        <span className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-background/60 mr-auto">
          Formato continuidad de contrato.
        </span>
        
        {/* Checkbox para controlar la observación */}
        <div className="flex items-center space-x-2 mr-2">
          <Checkbox 
            id="mostrar-observacion" 
            checked={mostrarObservacion} 
            onCheckedChange={(checked) => setMostrarObservacion(checked === true)}
            className="border-background/40 data-[state=checked]:bg-background data-[state=checked]:text-foreground"
          />
          <Label 
            htmlFor="mostrar-observacion" 
            className="text-xs text-background cursor-pointer leading-tight whitespace-nowrap"
          >
            Mostrar "El área no entregó"
          </Label>
        </div>

        <button
          onClick={() => window.print()}
          disabled={status !== "ready"}
          className="flex items-center gap-1.5 bg-background text-foreground border-0 rounded px-4 py-1.5 text-xs font-bold tracking-[0.05em] uppercase cursor-pointer transition-opacity hover:opacity-90 disabled:bg-muted-foreground/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          Imprimir
        </button>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 bg-transparent text-background/70 border border-background/20 rounded px-3.5 py-1.5 text-xs font-semibold tracking-[0.05em] uppercase cursor-pointer hover:bg-background/10 transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Cerrar
        </button>
      </div>

      {/* Estados de carga / no encontrado */}
      {status === "loading" && (
        <div className="no-print flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <p className="text-sm m-0">Cargando formato…</p>
        </div>
      )}

      {status === "notfound" && (
        <div className="no-print flex items-center justify-center min-h-[60vh] p-4">
          <div className="bg-card border border-border rounded-lg px-8 py-8 text-center max-w-md shadow-sm">
            <FileX2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground mb-1">
              Registro no encontrado
            </p>
            <p className="text-xs text-muted-foreground m-0">
              Número: <strong className="text-foreground">{numero || "—"}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Documento imprimible */}
      {data && (
        <div className="print-area-wrapper">
          <RecontratacionPrint data={data} mostrarObservacionAreaNoEntrego={mostrarObservacion} />
        </div>
      )}

      <style>{`
        /* ── Pantalla: simula hoja sobre fondo gris ── */
        @media screen {
          body {
            background: hsl(var(--muted));
            margin: 0;
          }
          .print-area-wrapper {
            padding: 24px 16px 48px;
          }
          .printRoot {
            max-width: 8.5in;
            margin: 0 auto;
            background: #fff;
            box-shadow:
              0 1px 3px rgba(0,0,0,0.12),
              0 4px 16px rgba(0,0,0,0.08);
          }
        }

        /* ── Impresión: ocultar chrome, ajustar a Letter ── */
        @media print {
          body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-area-wrapper { padding: 0 !important; }
          .printRoot {
            box-shadow: none !important;
            width: 8.5in !important;
            max-width: 8.5in !important;
          }
        }

        /* ── Responsive: pantallas pequeñas ── */
        @media screen and (max-width: 700px) {
          .print-area-wrapper {
            padding: 12px 0;
          }
          .printRoot {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  )
}
