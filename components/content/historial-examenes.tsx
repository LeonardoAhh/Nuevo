"use client"

import { useEffect, useState } from "react"
import { useHistorialExamenes, type ExamenHistorial } from "@/lib/hooks/useHistorialExamenes"
import { Search, History, Calendar, FileText, CheckCircle2, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { generarFolioExamen } from "@/lib/utils"

export default function HistorialExamenesContent() {
  const { examenes, loading, error, buscar, eliminar } = useHistorialExamenes()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExamen, setSelectedExamen] = useState<ExamenHistorial | null>(null)

  useEffect(() => {
    // Initial fetch
    buscar("")
  }, [buscar])

  const handleSearch = () => {
    buscar(searchTerm)
  }

  const formatFecha = (iso: string) => {
    try {
      return format(new Date(iso), "dd 'de' MMMM, yyyy", { locale: es })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Historial de Exámenes</h2>
          <p className="text-sm text-muted-foreground">
            Consulta los exámenes que se han generado y sus hojas de respuestas.
          </p>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio o nombre..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="text-destructive text-center py-8">{error}</div>
      ) : examenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
          <History size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron exámenes</p>
          <p className="text-sm text-center max-w-sm mt-1 opacity-70">
            Los exámenes generados aparecerán aquí para que puedas consultar sus hojas de respuestas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examenes.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedExamen(ex)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground">FOLIO</span>
                    <p className="font-mono text-sm">{generarFolioExamen(ex.id, ex.empleado?.numero, ex.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">
                      Categoría {ex.categoria_destino}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar examen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el historial de este examen (Folio: {generarFolioExamen(ex.id, ex.empleado?.numero, ex.created_at)}).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              eliminar(ex.id)
                            }}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm truncate" title={ex.empleado?.nombre ?? "Desconocido"}>
                    {ex.empleado?.nombre ?? "Empleado Desconocido"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{ex.empleado?.numero ?? "—"} · {ex.departamento}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatFecha(ex.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText size={12} />
                    <span>{ex.preguntas.length} preguntas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedExamen} onOpenChange={(open) => !open && setSelectedExamen(null)}>
        <DialogContent raw className="w-full sm:max-w-3xl max-h-[90dvh] flex flex-col gap-0 p-0">
          {/* Header */}
          <DialogHeader className="px-4 sm:px-5 pt-5 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0 text-left">
                  <DialogTitle className="text-base leading-tight">Hoja de Respuestas</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5 line-clamp-1">
                    Empleado: {selectedExamen?.empleado?.nombre} (#{selectedExamen?.empleado?.numero})
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="flex items-center gap-1 text-[11px] font-medium bg-muted rounded-full px-2.5 py-1 font-mono">
                FOLIO: {selectedExamen ? generarFolioExamen(selectedExamen.id, selectedExamen.empleado?.numero, selectedExamen.created_at) : ""}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary rounded-full px-2.5 py-1">
                Categoría: {selectedExamen?.categoria_destino}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium bg-muted rounded-full px-2.5 py-1">
                Depto: {selectedExamen?.departamento}
              </span>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto min-h-0 bg-muted/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedExamen?.preguntas.map((p, index) => {
                const correcta = p.respuesta_correcta?.toUpperCase()
                return (
                  <div key={p.id} className="bg-background rounded-lg p-3 border border-border shadow-sm flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[13px] text-foreground leading-snug">
                        <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
                        <span className="line-clamp-2" title={p.pregunta}>{p.pregunta}</span>
                      </p>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-full border border-success bg-success/10 text-success flex items-center justify-center font-bold text-base">
                      {correcta}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-4 sm:px-5 py-3 flex justify-end bg-card">
            <Button type="button" variant="outline" onClick={() => setSelectedExamen(null)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
