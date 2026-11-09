"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, Lock, Printer, Loader2, FileX2 } from "lucide-react"
import RecontratacionPrint, { type RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"
import { useRole } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function RecontratacionPrintPage() {
  const router = useRouter()
  const params = useSearchParams()
  const numero = params.get("numero") ?? ""
  const { fetchByNumero } = useRecontratacion()
  const { isEvaluador, loading: roleLoading } = useRole()
  const [data, setData] = useState<RecontratacionPrintData | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading")
  const [loadedNumber, setLoadedNumber] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mostrarObservacion, setMostrarObservacion] = useState(true)
  const [rgEstado, setRgEstado] = useState<string>("")
  const [autorizacionContrato, setAutorizacionContrato] = useState<string>("")

  useEffect(() => {
    if (roleLoading || isEvaluador) return
    if (!numero) return
    let cancelled = false
    fetchByNumero(numero).then(d => {
      if (cancelled) return
      setLoadedNumber(numero)
      if (!d) { setStatus("notfound"); return }
      setData(d)
      setStatus("ready")
    }).catch((error: unknown) => {
      if (cancelled) return
      setLoadedNumber(numero)
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar el formato.")
      setStatus("error")
    })
    return () => { cancelled = true }
  }, [numero, fetchByNumero, roleLoading, isEvaluador])

  const viewStatus = loadedNumber === numero
    ? status
    : numero
      ? "loading"
      : "notfound"
  const currentData = loadedNumber === numero ? data : null

  const volverAListado = () => router.push("/recontratacion")

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
      <header className="no-print sticky top-0 z-50 border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-7 tracking-tight text-foreground">
              {viewStatus === "notfound" || viewStatus === "error" ? "Formato no disponible" : "Preparar impresión"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {viewStatus === "ready" && currentData
                ? <>{currentData.nombre} <span className="px-1" aria-hidden="true">·</span> No. {currentData.numero}</>
                : viewStatus === "loading"
                  ? "Cargando los datos del formato…"
                  : "Regresa al listado para seleccionar otro registro."}
            </p>
            {viewStatus === "ready" && (
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa las opciones y el documento. La ventana de impresión se abrirá al pulsar Imprimir.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 gap-2 px-3 py-0 text-sm"
              onClick={volverAListado}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al listado
            </Button>
            <Button
              type="button"
              className="h-11 min-h-11 gap-2 px-4 py-0 text-sm"
              onClick={() => window.print()}
              disabled={viewStatus !== "ready"}
            >
              <Printer className="size-4" aria-hidden="true" />
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      {/* Panel de configuración antes de imprimir — solo pantalla */}
      {viewStatus === "ready" && (
        <section aria-labelledby="print-options-title" className="no-print border-b border-border bg-card px-4 py-4">
          <div className="mx-auto max-w-5xl space-y-4">
            <div>
              <h2 id="print-options-title" className="text-sm font-semibold text-foreground">
                Opciones del formato
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecciona qué información debe aparecer en el documento impreso.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* RG-REC-048 */}
              <fieldset className="min-w-0 space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <legend className="text-xs font-medium text-foreground">
                  RG-REC-048 requisitado y entregado:
                </legend>
                <RadioGroup value={rgEstado} onValueChange={setRgEstado} className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex min-h-11 items-center gap-2">
                    <RadioGroupItem value="SI" id="rg-si" />
                    <Label htmlFor="rg-si" className="text-sm cursor-pointer">SI</Label>
                  </div>
                  <div className="flex min-h-11 items-center gap-2">
                    <RadioGroupItem value="NO" id="rg-no" />
                    <Label htmlFor="rg-no" className="text-sm cursor-pointer">NO</Label>
                  </div>
                  <div className="flex min-h-11 items-center gap-2">
                    <RadioGroupItem value="" id="rg-ninguno" />
                    <Label htmlFor="rg-ninguno" className="text-sm cursor-pointer text-muted-foreground">
                      Dejar en blanco
                    </Label>
                  </div>
                </RadioGroup>
              </fieldset>

              {/* Autorización de contrato */}
              <fieldset className="min-w-0 space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <legend className="text-xs font-medium text-foreground">
                  ¿Autoriza contrato indeterminado?
                </legend>
                <RadioGroup value={autorizacionContrato} onValueChange={setAutorizacionContrato} className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex min-h-11 items-center gap-2">
                    <RadioGroupItem value="SI" id="auth-si" />
                    <Label htmlFor="auth-si" className="text-sm cursor-pointer">SI</Label>
                  </div>
                  <div className="flex min-h-11 items-center gap-2">
                    <RadioGroupItem value="NO" id="auth-no" />
                    <Label htmlFor="auth-no" className="text-sm cursor-pointer">NO</Label>
                  </div>
                  <div className="flex min-h-11 items-center gap-2">
                    <RadioGroupItem value="" id="auth-ninguno" />
                    <Label htmlFor="auth-ninguno" className="text-sm cursor-pointer text-muted-foreground">
                      Dejar en blanco
                    </Label>
                  </div>
                </RadioGroup>
              </fieldset>
            </div>

            {/* Checkbox para observación */}
            <div className="flex min-h-11 items-center gap-2 border-t border-border pt-2">
              <Checkbox 
                id="mostrar-observacion-panel" 
                checked={mostrarObservacion} 
                onCheckedChange={(checked) => setMostrarObservacion(checked === true)}
              />
              <Label 
                htmlFor="mostrar-observacion-panel" 
                className="text-sm cursor-pointer"
              >
                Mostrar &quot;El área no entregó&quot; en evaluaciones sin calificación
              </Label>
            </div>
          </div>
        </section>
      )}

      {/* Estados de carga / no encontrado */}
      {viewStatus === "loading" && (
        <div className="no-print flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <p className="text-sm m-0">Cargando formato…</p>
        </div>
      )}

      {viewStatus === "notfound" && (
        <div className="no-print flex items-center justify-center min-h-[60vh] p-4">
          <div className="max-w-md rounded-xl border border-border bg-card px-8 py-8 text-center">
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

      {viewStatus === "error" && (
        <div className="no-print flex min-h-[60vh] items-center justify-center p-4">
          <div role="alert" className="max-w-md rounded-xl border border-border bg-card px-8 py-8 text-center">
            <AlertCircle className="mx-auto mb-3 size-8 text-destructive" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">No se pudo cargar el formato</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>
        </div>
      )}

      {/* Documento imprimible */}
      {viewStatus === "ready" && currentData && (
        <div className="print-area-wrapper">
          <RecontratacionPrint
            data={currentData}
            mostrarObservacionAreaNoEntrego={mostrarObservacion}
            rgEstado={rgEstado}
            autorizacionContrato={autorizacionContrato}
          />
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
