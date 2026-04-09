"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Check, RefreshCw } from "lucide-react"
import { useTheme } from "@/components/theme-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  onColorChange?: (color: string) => void
}

export function ColorPicker({ onColorChange }: ColorPickerProps) {
  const { customColor, setCustomColor, accentColor, setAccentColor } = useTheme()
  const [tempColor, setTempColor] = useState(customColor)
  const [showCheck, setShowCheck] = useState(false)

  // Update tempColor when customColor changes
  useEffect(() => {
    setTempColor(customColor)
  }, [customColor])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempColor(e.target.value)
  }

  const handleApplyColor = () => {
    // Apply the color immediately
    setCustomColor(tempColor)
    setAccentColor("custom")

    if (onColorChange) {
      onColorChange(tempColor)
    }

    // Show check mark animation
    setShowCheck(true)
    setTimeout(() => setShowCheck(false), 1500)
  }

  const handleResetColor = () => {
    setTempColor("#3b82f6") // Reset to default blue
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="color"
            value={tempColor}
            onChange={handleColorChange}
            className="h-10 w-10 cursor-pointer rounded-md border-2 border-border p-0"
            id="custom-color-picker"
            aria-label="Select custom accent color"
          />
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            placeholder="#RRGGBB"
          />
        </div>

        <Button variant="outline" size="icon" onClick={handleResetColor} className="h-10 w-10">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Reset color</span>
        </Button>

        <Button
          onClick={handleApplyColor}
          className={cn(
            "relative",
            accentColor === "custom" && tempColor === customColor ? "bg-primary text-primary-foreground" : "",
          )}
        >
          {showCheck ? <Check className="h-4 w-4 animate-in fade-in zoom-in" /> : "Apply Color"}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">Enter a valid hex color code (e.g., #FF5500)</div>

      <div className="flex flex-wrap gap-2 mt-2">
        <div className="p-4 rounded-md border border-border" style={{ backgroundColor: tempColor }}>
          <div
            className="text-sm font-medium"
            style={{
              color: useTheme().isColorLight(tempColor) ? "#000000" : "#ffffff",
            }}
          >
            Color Preview
          </div>
        </div>
        <Button
          className="hover:bg-opacity-90"
          style={{ backgroundColor: tempColor, color: useTheme().isColorLight(tempColor) ? "#000000" : "#ffffff" }}
        >
          Button Preview
        </Button>
      </div>
    </div>
  )
}
