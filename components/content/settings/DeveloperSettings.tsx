"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useMaintenanceMode } from "@/lib/hooks/useMaintenanceMode"
import { ASSIGNMENTS_PATH } from "@/lib/navigation"
import { SettingsGroup, SettingsRow, SettingsSectionHeader } from "./SettingsPrimitives"

export function DeveloperSettings() {
  const { isMaintenance, endsAt, toggleMaintenance, loading, saving, saveError } = useMaintenanceMode()
  const [duration, setDuration] = useState("30")
  const [unit, setUnit] = useState("60")
  const [feedback, setFeedback] = useState("")
  const seconds = Number(duration) * Number(unit)
  const validDuration = duration.trim() !== "" && Number.isFinite(seconds) && seconds >= 1 && seconds <= 365 * 86400

  const saveMaintenance = async (active: boolean) => {
    setFeedback("")
    const success = await toggleMaintenance(active, seconds)
    setFeedback(success
      ? active
        ? "Mantenimiento guardado. El contador comienza desde ahora."
        : "Mantenimiento desactivado."
      : "")
  }

  return (
    <div className="space-y-5">
      <SettingsSectionHeader
        title="Desarrollador"
        description="Peligro: Opciones avanzadas de control global del sistema."
      />

      <SettingsGroup title="Control de Sistema">
        <SettingsRow
          label="Modo mantenimiento"
          description="Al activar, todos los usuarios en producción serán bloqueados y verán la pantalla de mantenimiento. Tú seguirás teniendo acceso si estás en localhost."
          htmlFor="maintenance-mode"
        >
          <Switch
            id="maintenance-mode"
            checked={isMaintenance}
            onCheckedChange={saveMaintenance}
            disabled={loading || saving || (!isMaintenance && !validDuration)}
          />
        </SettingsRow>
        <div className="space-y-3 py-4">
          <Label htmlFor="maintenance-duration" className="text-sm font-medium">
            Duración estimada
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="maintenance-duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              disabled={loading || saving}
              aria-invalid={!validDuration}
              aria-describedby="maintenance-duration-help"
              className="min-h-11 w-full sm:w-28"
            />
            <Select value={unit} onValueChange={setUnit} disabled={loading || saving}>
              <SelectTrigger className="min-h-11 w-full sm:w-36" aria-label="Unidad de duración">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Segundos</SelectItem>
                <SelectItem value="60">Minutos</SelectItem>
                <SelectItem value="3600">Horas</SelectItem>
                <SelectItem value="86400">Días</SelectItem>
              </SelectContent>
            </Select>
            {isMaintenance && (
              <Button
                type="button"
                className="min-h-11"
                onClick={() => void saveMaintenance(true)}
                disabled={loading || saving || !validDuration}
              >
                {saving ? "Guardando…" : "Reiniciar contador"}
              </Button>
            )}
          </div>
          <p id="maintenance-duration-help" className="text-sm leading-5 text-muted-foreground">
            {validDuration
              ? "El contador comienza al activar o reiniciar. Al llegar a cero, el mantenimiento sigue activo hasta que lo desactives."
              : "Introduce una duración entre 1 segundo y 365 días."}
          </p>
          {isMaintenance && endsAt && Number.isFinite(Date.parse(endsAt)) && (
            <p className="text-sm text-muted-foreground">
              Fin estimado: {new Date(endsAt).toLocaleString("es-MX")}
            </p>
          )}
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          {feedback && <p role="status" className="text-sm text-foreground">{feedback}</p>}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Evaluaciones">
        <SettingsRow
          label="Asignaciones de evaluadores"
          description="Elige las áreas y personas que puede evaluar cada cuenta."
        >
          <Button asChild type="button" variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link href={ASSIGNMENTS_PATH}>
              Abrir asignaciones
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </SettingsRow>
      </SettingsGroup>
    </div>
  )
}
