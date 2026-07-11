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
    <Dialog open={open} onOpenChange={(val) => { if (!isDownloading) onClose() }}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-md shadow-2xl">
        <div className="p-6 pb-0">
          <DialogHeader className="mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Generar Reporte Excel</DialogTitle>
            <DialogDescription className="text-center">
              Se creará un documento detallado con el progreso y estado actual de capacitación.
            </DialogDescription>
          </DialogHeader>

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

        <div className="p-6 mt-4 bg-muted/30 border-t border-border/50">
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading} 
            className="w-full relative h-11 transition-all duration-300"
          >
            <AnimatePresence mode="wait">
              {isDownloading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Procesando archivo...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar ahora</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewCard({ icon, label, value, delay }: { icon: React.ReactNode, label: string, value: number, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background shadow-sm border border-border/50">
          {icon}
        </div>
        <span className="text-sm font-medium text-foreground/80">{label}</span>
      </div>
      <span className="font-semibold text-foreground bg-background px-2.5 py-1 rounded-md shadow-sm border border-border/50 text-sm">
        {value.toLocaleString()}
      </span>
    </motion.div>
  )
}
