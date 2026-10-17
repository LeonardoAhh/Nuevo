"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  href?: string;
  className?: string;
  badge?: number;
}
export function ActionButton({
  icon,
  label,
  tooltip,
  onClick,
  disabled,
  variant = "outline",
  href,
  badge,
  className
}: ActionButtonProps) {
  const content = <><span aria-hidden="true">{icon}</span><span>{label}</span>{!!badge && badge > 0 && <span className="rounded-md bg-destructive px-1.5 text-xs tabular-nums text-destructive-foreground">{badge}</span>}</>;
  return <Tooltip><TooltipTrigger asChild>
      {href && !disabled ? <Button asChild variant={variant} className={className}><Link href={href} aria-label={tooltip}>{content}</Link></Button> : <span tabIndex={disabled ? 0 : undefined} aria-label={disabled ? tooltip : undefined}><Button type="button" className={className} variant={variant} onClick={onClick} disabled={disabled} aria-label={tooltip}>{content}</Button></span>}
    </TooltipTrigger><TooltipContent>{tooltip}</TooltipContent></Tooltip>;
}

// ─── Aviso con severidad (color semántico por tema, responsivo) ───────────────

export function NoticeCard({
  tone,
  icon,
  title,
  children
}: {
  tone: "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  // Color semántico mediante los tokens compartidos.
  const color = tone === "danger" ? "text-destructive" : "text-warning";
  return <div role="alert" className="flex items-center gap-1.5 py-1">
    <span className={cn("flex shrink-0 items-center justify-center", color)} aria-hidden="true">
      {icon}
    </span>
    <div className="flex flex-col sm:flex-row sm:items-center min-w-0 gap-x-1.5 gap-y-0.5 text-sm">
      <span className={cn("font-medium", color)}>
        {title}{title ? ":" : ""}
      </span>
      <span className="text-foreground/80">{children}</span>
    </div>
  </div>;
}

// ─── Botón de práctica ────────────────────────────────────────────────────────

interface GuiaButtonProps {
  onClick: () => void;
}
export function GuiaButton({
  onClick
}: GuiaButtonProps) {
  return <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="default" onClick={onClick} aria-label="Practicar evaluación con ejemplo" aria-haspopup="dialog" className="min-h-11 w-11 shrink-0 gap-2 px-0 sm:w-auto sm:px-4">
        <GraduationCap className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Practicar</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Practicar evaluación con ejemplo</TooltipContent>
  </Tooltip>;
}
