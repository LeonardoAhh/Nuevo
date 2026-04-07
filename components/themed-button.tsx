"use client"

import type React from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { useTheme } from "@/theme-context"
import { cn } from "@/lib/utils"

interface ThemedButtonProps extends ButtonProps {
  customStyle?: React.CSSProperties
}

export function ThemedButton({ className, customStyle, ...props }: ThemedButtonProps) {
  const { accentColor, customColor } = useTheme()

  // Only apply custom styling if using custom accent color
  const style =
    accentColor === "custom"
      ? {
          ...customStyle,
          // We don't need to set these as they're handled by CSS variables
        }
      : customStyle

  return (
    <Button
      className={cn(
        // Default classes
        className,
      )}
      style={style}
      {...props}
    />
  )
}
