"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (v: number) => void
  size?: number
  readOnly?: boolean
  className?: string
  ariaLabel?: string
}

/**
 * Star rating display / input (1-5). Use `onChange` for input, omit for read-only.
 * Tokens: fill uses text-warning; empty uses text-muted-foreground.
 */
export function StarRating({
  value,
  onChange,
  size = 16,
  readOnly = false,
  className,
  ariaLabel,
}: StarRatingProps) {
  const interactive = !readOnly && !!onChange
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel ?? `${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value)
        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === Math.round(value)}
              aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
              onClick={() => onChange?.(i)}
              className="p-0.5 rounded hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                size={size}
                className={cn(
                  "transition-colors",
                  filled ? "fill-warning text-warning" : "text-muted-foreground/40",
                )}
              />
            </button>
          )
        }
        return (
          <Star
            key={i}
            size={size}
            className={cn(
              filled ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        )
      })}
    </div>
  )
}
