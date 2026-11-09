"use client"

import { useId, useRef } from "react"
import { ShieldAlert } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ReglamentoIncumplimientoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  date: string
  count: string
  existingCount: number | null
  employeeName: string
  employeeNumber: string
  error: string | null
  onDateChange: (date: string) => void
  onCountChange: (count: string) => void
  onErrorChange: (error: string | null) => void
  onSave: () => void
  onReturnFocus: () => void
}

function formatCount(count: number): string {
  return `${count} ${count === 1 ? "incumplimiento" : "incumplimientos"}`
}

export function ReglamentoIncumplimientoFormDialog({
  open,
  onOpenChange,
  saving,
  date,
  count,
  existingCount,
  employeeName,
  employeeNumber,
  error,
  onDateChange,
  onCountChange,
  onErrorChange,
  onSave,
  onReturnFocus,
}: ReglamentoIncumplimientoFormDialogProps) {
  const formId = useId()
  const dateInputRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        onOpenChange(nextOpen)
        if (!nextOpen) onErrorChange(null)
      }}
    >
      <DialogContent
        footer={
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form={formId}
              className="min-h-11 w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? "Guardando..." : existingCount !== null ? "Actualizar cantidad" : "Guardar"}
            </Button>
          </DialogFooter>
        }
        onOpenAutoFocus={event => {
          event.preventDefault()
          dateInputRef.current?.focus()
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          onReturnFocus()
        }}
        onEscapeKeyDown={event => {
          if (saving) event.preventDefault()
        }}
        onPointerDownOutside={event => {
          if (saving) event.preventDefault()
        }}
        className="gap-0 border-border"
      >
        <DialogHeader>
          <DialogTitle>Nuevo incumplimiento</DialogTitle>
          <DialogDescription>
            {employeeName} · Núm. {employeeNumber}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={event => {
            event.preventDefault()
            onSave()
          }}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive" role="alert">
              <ShieldAlert className="size-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {existingCount !== null && (
            <Alert role="status">
              <ShieldAlert className="size-4" aria-hidden="true" />
              <AlertDescription>
                Ya hay {formatCount(existingCount)} registrado para este día. Si es reincidencia, valida la información y captura la nueva cantidad total.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-fecha`}>Fecha del incumplimiento</Label>
            <Input
              ref={dateInputRef}
              id={`${formId}-fecha`}
              type="date"
              required
              value={date}
              onChange={event => onDateChange(event.target.value)}
              disabled={saving}
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-cantidad`}>Cantidad total de incumplimientos ese día</Label>
            <Input
              id={`${formId}-cantidad`}
              type="number"
              min={1}
              max={2_147_483_647}
              step={1}
              required
              value={count}
              onChange={event => onCountChange(event.target.value)}
              disabled={saving}
              className="min-h-11"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
