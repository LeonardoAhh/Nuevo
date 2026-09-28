"use client"

import { flushSync } from "react-dom"
import { Printer } from "lucide-react"
import { ModalFooter, ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"

interface PrintInstructionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

const PRINT_GUIDE = {
  title: "Preparar impresión",
  description: "Al continuar se abrirá la ventana de impresión. Antes de imprimir, revisa estos ajustes para conservar el formato del documento.",
  steps: [
    {
      title: "Abre las opciones de impresión",
      description: "En Chrome o Edge, despliega Más opciones de configuración y busca Opciones.",
    },
    {
      title: "Desmarca Encabezados y pies de página",
      description: "Así evitas que el navegador añada la dirección del sitio y la fecha al documento. El código y la revisión del formato se conservan.",
    },
  ],
  note: "La ubicación y el nombre de estas opciones pueden variar según el navegador o el dispositivo.",
} as const

export function PrintInstructionDialog({ open, onOpenChange, onConfirm }: PrintInstructionDialogProps) {
  const close = () => onOpenChange(false)
  const handleConfirm = () => {
    if (!open) return
    // Confirma el cierre en el DOM antes de abrir el diálogo nativo, sin temporizadores.
    flushSync(close)
    onConfirm()
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={close}
      title={PRINT_GUIDE.title}
      description={PRINT_GUIDE.description}
      maxWidth="sm:max-w-md"
      contentClassName="print:hidden [&_button]:min-h-11"
    >
      <div className="shrink-0 [&_button]:min-w-11">
        <ModalHeader title={PRINT_GUIDE.title} onClose={close} />
      </div>

      <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{PRINT_GUIDE.description}</p>
        <ol className="mt-5 space-y-4" aria-label="Ajustes antes de imprimir">
          {PRINT_GUIDE.steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-semibold leading-relaxed">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{PRINT_GUIDE.note}</p>
      </div>

      <ModalFooter
        className="[&_button]:whitespace-nowrap [&_button]:px-3 sm:[&_button]:px-4"
        onCancel={close}
        onConfirm={handleConfirm}
        confirmLabel="Continuar"
        confirmIcon={<Printer className="size-4" aria-hidden="true" />}
      />
    </ResponsiveShell>
  )
}
