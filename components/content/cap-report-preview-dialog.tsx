"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, BookOpen, GraduationCap, Download, Loader2, FileSpreadsheet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "@/components/redesign/modal-header"
import { RedesignModalFooter } from "@/components/redesign/modal-footer"

interface CapReportPreviewDialogProps {
  open: boolean
  onClose: () => void
  onDownload: () => Promise<void>
  metrics: {
    totalEmployees: number
    totalCourses: number
    totalRecords: number
  }
}

export function CapReportPreviewDialog({ open, onClose, onDownload, metrics }: CapReportPreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownload()
      // Optional: Add a slight delay for better UX if the generation is too fast
      await new Promise(resolve => setTimeout(resolve, 800))
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <ResponsiveShell open={open} onClose={() => { if (!isDownloading) onClose() }} maxWidth="sm:max-w-[425px]" title="Generar Reporte">
      <RedesignModalHeader
        title="Generar Reporte Excel"
        icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
        onClose={() => { if (!isDownloading) onClose() }}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-6">
          <div className="space-y-3">
            <PreviewCard
              icon={<Users className="h-4 w-4 text-primary" />}
              label="Empleados incluidos"
              value={metrics.totalEmployees}
              delay={0.1}
            />
            <PreviewCard
              icon={<BookOpen className="h-4 w-4 text-foreground/80" />}
              label="Cursos del catálogo"
              value={metrics.totalCourses}
              delay={0.2}
            />
            <PreviewCard
              icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
              label="Registros de avance"
              value={metrics.totalRecords}
              delay={0.3}
            />
          </div>
        </div>
      </div>

      <RedesignModalFooter
        onCancel={() => { if (!isDownloading) onClose() }}
        cancelLabel="Cancelar"
        onConfirm={handleDownload}
        saving={isDownloading}
        confirmLabel="Descargar ahora"
        confirmIcon={<Download className="h-4 w-4" />}
      />
    </ResponsiveShell>
  )
}

function PreviewCard({ icon, label, value, delay }: { icon: React.ReactNode, label: string, value: number, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between p-3 rounded-md border border-border/60 bg-transparent hover:bg-muted/30 transition-colors shadow-none"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-muted text-muted-foreground border border-border/60 shadow-none flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium text-ink">{label}</span>
      </div>
      <span className="font-medium text-ink bg-muted px-2.5 py-1 rounded-md text-sm">
        {value.toLocaleString()}
      </span>
    </motion.div>
  )
}
