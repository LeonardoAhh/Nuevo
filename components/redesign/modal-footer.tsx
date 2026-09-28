import React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface RedesignModalSecondaryAction {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'secondary' | 'outline' | 'ghost'
}

export interface RedesignModalFooterProps {
  onCancel?: () => void
  cancelLabel?: string
  cancelDisabled?: boolean
  onConfirm?: () => void
  confirmLabel?: string
  confirmIcon?: React.ReactNode
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'destructive'
  saving?: boolean
  secondaryAction?: RedesignModalSecondaryAction
  confirmTooltip?: string
}

export function RedesignModalFooter({
  onCancel,
  cancelLabel = "Cancelar",
  cancelDisabled,
  onConfirm,
  confirmLabel = "Guardar",
  confirmIcon,
  confirmDisabled,
  confirmVariant = 'primary',
  saving,
  secondaryAction,
  confirmTooltip,
}: RedesignModalFooterProps) {
  
  // No shadows, 8px radius (rounded-md), semantic colors
  const confirmClasses = confirmVariant === 'destructive'
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : "bg-primary text-primary-foreground hover:bg-primary/90"

  const secondaryClasses = secondaryAction?.variant === 'outline'
    ? "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground"
    : secondaryAction?.variant === 'ghost'
    ? "hover:bg-accent hover:text-accent-foreground"
    : "bg-surface-card text-ink border border-border hover:bg-accent"

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/60 bg-surface-card shrink-0 mt-auto">
      <div className="flex-1">
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={saving || secondaryAction.disabled}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              secondaryClasses
            )}
          >
            {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
            {secondaryAction.label}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || cancelDisabled}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-ink"
          >
            {cancelLabel}
          </button>
        )}
        {onConfirm && (() => {
          const btn = (
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving || confirmDisabled}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                confirmClasses
              )}
            >
              {saving ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : confirmIcon ? (
                <span className="mr-2">{confirmIcon}</span>
              ) : null}
              {confirmLabel}
            </button>
          )

          if (!confirmTooltip) return btn

          return (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="inline-block cursor-not-allowed">
                    {btn}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-destructive text-destructive-foreground border-destructive font-normal text-xs px-2.5 py-1.5">
                  {confirmTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })()}
      </div>
    </div>
  )
}
