import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"

export function SettingsSectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <header className="space-y-1">
      <h2 className="text-xl font-semibold leading-7 tracking-tight text-foreground">
        {title}
      </h2>
      <p className="text-sm leading-5 text-muted-foreground">{description}</p>
    </header>
  )
}

export function SettingsGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <h3 className="border-b border-border px-4 py-3 font-sans text-xs font-medium uppercase leading-4 text-muted-foreground sm:px-5">
        {title}
      </h3>
      <div className="divide-y divide-border px-4 sm:px-5">{children}</div>
    </section>
  )
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string
  description?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="cursor-pointer text-sm font-medium">
            {label}
          </Label>
        ) : (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
        {description && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex min-h-11 shrink-0 items-center sm:justify-end">{children}</div>
    </div>
  )
}
