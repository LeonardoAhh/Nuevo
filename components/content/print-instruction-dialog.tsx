"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, AlertTriangle } from "lucide-react"

interface PrintInstructionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PrintInstructionDialog({ open, onOpenChange, onConfirm }: PrintInstructionDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false)
    setTimeout(onConfirm, 200) // Pequeño delay para que el modal se cierre antes de invocar la impresión
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-amber-100 p-3 rounded-full mb-2 w-fit">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Antes de imprimir...</DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            Para que la evaluación ocupe toda la hoja y el formato se vea correctamente, 
            asegúrate de <strong>desmarcar</strong> la opción de <em>Encabezados y pies de página</em>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-5 bg-[#202124] rounded-xl border border-slate-200 shadow-inner flex flex-col gap-3 relative overflow-hidden">
          <style>{`
            @keyframes uncheckAnim {
              0%, 30% { background-color: #8ab4f8; border-color: #8ab4f8; }
              40%, 90% { background-color: transparent; border-color: #9aa0a6; }
              100% { background-color: #8ab4f8; border-color: #8ab4f8; }
            }
            @keyframes checkmarkAnim {
              0%, 30% { opacity: 1; transform: scale(1); }
              40%, 90% { opacity: 0; transform: scale(0.5); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes pointerAnim {
              0%, 15% { transform: translate(40px, 30px); opacity: 0; }
              25% { transform: translate(0px, 0px); opacity: 1; }
              35% { transform: translate(0px, 0px) scale(0.9); opacity: 1; }
              45%, 90% { transform: translate(20px, 20px); opacity: 0; }
              100% { transform: translate(40px, 30px); opacity: 0; }
            }
            .chrome-checkbox {
              animation: uncheckAnim 4s ease infinite;
            }
            .chrome-checkmark {
              animation: checkmarkAnim 4s ease infinite;
            }
            .chrome-pointer {
              animation: pointerAnim 4s ease infinite;
            }
          `}</style>
          
          <div className="flex items-center justify-between text-[#e8eaed] font-sans text-[13px] tracking-wide relative z-10">
            <span>Opciones</span>
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                {/* El cuadro del checkbox */}
                <div className="chrome-checkbox w-4 h-4 rounded-[2px] border-2 border-[#8ab4f8] bg-[#8ab4f8] flex items-center justify-center transition-colors">
                  <svg className="chrome-checkmark w-3 h-3 text-[#202124]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* Puntero simulado */}
                <svg className="chrome-pointer absolute -bottom-3 -right-3 w-5 h-5 text-white drop-shadow-md z-20" fill="currentColor" viewBox="0 0 320 512">
                  <path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C22.279 469.975 8 464.261 8 453.407V46.593c0-10.854 14.279-16.568 22.277-8.569l288.948 274.672c8.89 8.57 2.223 23.43-10.036 23.43z" />
                </svg>
              </div>
              <span>Encabezados y pies de página</span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Printer className="h-4 w-4" />
            Entendido, Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
