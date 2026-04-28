"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Check, Palette, RefreshCw } from "lucide-react"
import { useTheme, DEFAULT_CUSTOM_COLOR } from "@/components/theme-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  onColorChange?: (color: string) => void
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

export function ColorPicker({ onColorChange }: ColorPickerProps) {
  const { customColor, setCustomColor, accentColor, setAccentColor, isColorLight } = useTheme()
  const [tempColor, setTempColor] = useState(customColor)
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    setTempColor(customColor)
  }, [customColor])

  const isValidHex = HEX_REGEX.test(tempColor)
  const previewLight = isValidHex ? isColorLight(tempColor) : true

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempColor(e.target.value)
  }

  const handleApplyColor = () => {
    if (!isValidHex) return
    setCustomColor(tempColor)
    setAccentColor("custom")

    if (onColorChange) {
      onColorChange(tempColor)
    }

    setShowCheck(true)
    setTimeout(() => setShowCheck(false), 1500)
  }

  const handleResetColor = () => {
    setTempColor(DEFAULT_CUSTOM_COLOR)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValidHex ? tempColor : DEFAULT_CUSTOM_COLOR}
            onChange={handleColorChange}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-md border-2 border-border p-0"
            id="custom-color-picker"
            aria-label="Selecciona un color de acento personalizado"
          />

          <div className="flex-1 sm:w-32">
            <input
              type="text"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              className={cn(
                "w-full h-10 px-3 rounded-md border bg-background font-mono text-sm",
                isValidHex ? "border-input" : "border-destructive",
              )}
              placeholder="#RRGGBB"
              maxLength={7}
              aria-invalid={!isValidHex}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetColor}
            className="h-10 w-10 shrink-0"
            aria-label="Restablecer color"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={handleApplyColor}
            disabled={!isValidHex}
            className={cn(
              "shrink-0",
              accentColor === "custom" && tempColor === customColor && "bg-primary text-primary-foreground",
            )}
            aria-label="Aplicar color"
            title="Aplicar color"
          >
            {showCheck ? <Check className="h-4 w-4 animate-in fade-in zoom-in" /> : <Palette className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Ingresa un código hex válido (por ejemplo, #FF5500).
      </p>

      <div className="flex flex-wrap gap-2">
        <div
          className="p-4 rounded-md border border-border"
          style={{ backgroundColor: isValidHex ? tempColor : "transparent" }}
        >
          <div
            className="text-sm font-medium"
            style={{
              color: previewLight ? "hsl(var(--foreground))" : "hsl(var(--primary-foreground))",
            }}
          >
            Vista previa del color
          </div>
        </div>
        <Button
          disabled={!isValidHex}
          className="hover:bg-opacity-90"
          style={
            isValidHex
              ? {
                  backgroundColor: tempColor,
                  color: previewLight ? "hsl(var(--foreground))" : "hsl(var(--primary-foreground))",
                }
              : undefined
          }
        >
          Vista previa del botón
        </Button>
      </div>
    </div>
  )
}
