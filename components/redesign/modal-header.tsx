import React from "react"

export interface RedesignModalHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  onClose?: () => void
}

export function RedesignModalHeader({ title, subtitle, icon }: RedesignModalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border/60 bg-surface-card sticky top-0 z-10 shrink-0">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {icon && <div className="text-muted-foreground flex shrink-0">{icon}</div>}
        <div className="flex flex-col min-w-0">
          <h2 className="text-xl font-normal tracking-[-0.02em] leading-normal text-ink truncate pb-0.5">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
