"use client"

import { useState } from "react"
import { Download, FileSpreadsheet } from "lucide-react"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "@/components/redesign/modal-header"
import { RedesignModalFooter } from "@/components/redesign/modal-footer"

interface CapReportPreviewDialogProps {
  open: boolean
  onClose: () => void
  onDownload: () => Promise<void>
}

export function CapReportPreviewDialog({ open, onClose, onDownload }: CapReportPreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownload()
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={() => { if (!isDownloading) onClose() }}
      maxWidth="sm:max-w-md"
      mobileVariant="dialog"
      title="Descargar reporte general"
    >
      <RedesignModalHeader
        title="Descargar reporte general"
        icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
        onClose={() => { if (!isDownloading) onClose() }}
      />

      <div className="p-5 sm:p-6 bg-card">
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">Reporte completo de capacitación</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Se generará una sola hoja con una fila por empleado y curso, conservando únicamente el intento más reciente.
            </p>
          </div>
        </div>
      </div>

      <RedesignModalFooter
        onCancel={() => { if (!isDownloading) onClose() }}
        cancelLabel="Cancelar"
        onConfirm={handleDownload}
        saving={isDownloading}
        confirmLabel="Descargar Excel"
        confirmIcon={<Download className="h-4 w-4" />}
      />
    </ResponsiveShell>
  )
}
