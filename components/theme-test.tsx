"use client"

import { useTheme } from "@/theme-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ThemeTest() {
  const { accentColor, customColor } = useTheme()

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Theme Test Component</h2>
      <p>
        Current accent color: <Badge>{accentColor}</Badge>
      </p>
      {accentColor === "custom" && (
        <p>
          Custom color value: <Badge>{customColor}</Badge>
        </p>
      )}

      <div className="flex gap-2">
        <Button>Primary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>
    </div>
  )
}
