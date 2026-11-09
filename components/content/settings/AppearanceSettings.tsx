"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-context"
import { SettingsGroup, SettingsRow, SettingsSectionHeader } from "./SettingsPrimitives"

export function AppearanceSettings() {
  const {
    fontSize,
    density,
    reducedMotion,
    themeMode,
    setThemeMode,
    setFontSize,
    setDensity,
    setReducedMotion,
    resetTheme,
  } = useTheme()

  return (
    <div className="space-y-5">
      <SettingsSectionHeader
        title="Apariencia"
        description="Ajusta la lectura y el ritmo visual de la aplicación."
      />

      <SettingsGroup title="Pantalla">
        <SettingsRow
          label="Tema oscuro"
          description="Usa la paleta grafito oscura en toda la aplicación."
          htmlFor="theme-mode"
        >
          <Switch
            id="theme-mode"
            checked={themeMode === "dark"}
            onCheckedChange={(enabled) => setThemeMode(enabled ? "dark" : "light")}
          />
        </SettingsRow>
        <SettingsRow
          label="Tamaño de fuente"
          description="Ajusta el tamaño del texto en toda la aplicación."
          htmlFor="font-size"
        >
          <Select
            value={fontSize}
            onValueChange={(value) => {
              if (value === "small" || value === "medium" || value === "large") {
                setFontSize(value)
              }
            }}
          >
            <SelectTrigger id="font-size" className="min-h-11 w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeño</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Densidad"
          description="Elige cuánto espacio hay entre los elementos."
          htmlFor="display-density"
        >
          <Select
            value={density}
            onValueChange={(value) => {
              if (value === "comfortable" || value === "compact") setDensity(value)
            }}
          >
            <SelectTrigger id="display-density" className="min-h-11 w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Cómoda</SelectItem>
              <SelectItem value="compact">Compacta</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Accesibilidad">
        <SettingsRow
          label="Movimiento reducido"
          description="Minimiza animaciones y transiciones."
          htmlFor="reduced-motion"
        >
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
            className="h-6 w-11"
          />
        </SettingsRow>
      </SettingsGroup>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 gap-2"
          onClick={resetTheme}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Restablecer valores
        </Button>
      </div>
    </div>
  )
}
