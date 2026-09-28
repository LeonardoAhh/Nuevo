"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  // Color semántico via tokens del tema (se adapta a claro/oscuro).
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

// ─── Botón "Guía" ─────────────────────────────────────────────────────────────

interface GuiaButtonProps {
  onClick: () => void;
}
export function GuiaButton({
  onClick
}: GuiaButtonProps) {
  return <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="outline" onClick={onClick} aria-label="Ver guía de evaluación" aria-haspopup="dialog" className="w-10 shrink-0 gap-2 px-0 sm:w-auto sm:px-4">
        <CircleHelp className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{DESEMPENO.actions.guide}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Ver guía de evaluación</TooltipContent>
  </Tooltip>;
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

export function DesempenoFormSkeleton() {
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} className="space-y-6">
    <Card>
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full max-w-52" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full max-w-52" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full max-w-52" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full max-w-52" />
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  </motion.div>;
}
