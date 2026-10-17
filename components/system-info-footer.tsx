"use client"

import { useEffect, useState } from "react"
import { animate } from "framer-motion"
import { Code2 } from "lucide-react"
import { useAppReducedMotion } from "@/components/app-transition"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkspaceContainer } from "@/components/ui/workspace-container"
import { cn } from "@/lib/utils"
import { version as appVersion } from "@/package.json"

const CREDIT_PREFIX = "Designed by "
const CREDIT_NAME = "LAHH"
const CREDIT_LENGTH = CREDIT_PREFIX.length + CREDIT_NAME.length

export function SystemInfoFooter({ variant = "sidebar", className }: {
  variant?: "sidebar" | "workspace"
  className?: string
}) {
  const reducedMotion = useAppReducedMotion()
  const [visibleCharacters, setVisibleCharacters] = useState(0)

  useEffect(() => {
    if (reducedMotion) return

    const controls = animate(0, CREDIT_LENGTH, {
      duration: CREDIT_LENGTH * 0.085,
      ease: "linear",
      repeat: Infinity,
      repeatDelay: 2,
      onUpdate: value => setVisibleCharacters(Math.min(CREDIT_LENGTH, Math.ceil(value))),
    })
    return () => controls.stop()
  }, [reducedMotion])

  const version = <div className={cn("flex items-center gap-2", variant === "sidebar" && "justify-between")}>
    <span>Versión del sistema</span>
    <span className="font-mono tabular-nums">v{appVersion}</span>
  </div>

  const credit = <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`${CREDIT_PREFIX}${CREDIT_NAME}`} className="flex min-h-8 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Code2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="relative inline-block whitespace-nowrap">
            <span aria-hidden="true" className="invisible">{CREDIT_PREFIX}<span className="font-medium">{CREDIT_NAME}</span></span>
            <span aria-hidden="true" className="absolute inset-0">
              {CREDIT_PREFIX.slice(0, reducedMotion ? CREDIT_PREFIX.length : visibleCharacters)}
              <span className="font-medium text-foreground">{CREDIT_NAME.slice(0, Math.max(0, (reducedMotion ? CREDIT_LENGTH : visibleCharacters) - CREDIT_PREFIX.length))}</span>
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">Dreams come true</TooltipContent>
    </Tooltip>
  </TooltipProvider>

  return <footer className={cn("shrink-0 border-t border-border text-xs text-muted-foreground", variant === "sidebar" && "px-4 py-3", className)}>
    {variant === "workspace" ? (
      <WorkspaceContainer className="safe-bottom-content flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-3">
        {version}
        {credit}
      </WorkspaceContainer>
    ) : (
      <div className="space-y-2">
        {version}
        {credit}
      </div>
    )}
  </footer>
}
