"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "selected" | "urgent";
type StatusTone = "success" | "warning" | "muted" | "destructive";

const cardVariants: Record<CardVariant, string> = {
  default: "border-border bg-card",
  selected: "border-primary bg-primary/5",
  urgent: "border-destructive/30 bg-destructive/5",
};

const statusTones: Record<StatusTone, string> = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  muted: "border-border bg-muted text-muted-foreground",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function PendingCard({
  asChild = false,
  interactive = false,
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { asChild?: boolean; interactive?: boolean; variant?: CardVariant }) {
  const Component = asChild ? Slot : "div";

  return <Component
    className={cn(
      "grid min-w-0 self-start grid-cols-[minmax(0,1fr)_auto] content-start items-start gap-x-3 gap-y-1 rounded-xl border px-3 py-2 text-left transition-colors duration-200",
      cardVariants[variant],
      interactive && (variant === "urgent"
        ? "cursor-pointer hover:border-destructive/60 hover:bg-destructive/10"
        : variant === "selected"
          ? "cursor-pointer hover:bg-primary/10"
          : "cursor-pointer hover:border-foreground/20 hover:bg-muted/30"),
      className,
    )}
    {...props}
  />;
}

export function PendingCardFields({
  number,
  name,
  detail,
  status,
}: {
  number: string | null;
  name: string;
  detail?: string | null;
  status: ReactNode;
}) {
  return <>
    <span className="min-w-0 text-xs leading-4 tabular-nums text-muted-foreground">#{number ?? "—"}</span>
    {status}
    <span className="col-span-2 min-w-0">
      <span className="block break-words text-sm font-medium leading-5 text-foreground">{name}</span>
      {detail && <span className="block break-words text-xs leading-4 text-muted-foreground">{detail}</span>}
    </span>
  </>;
}

export function PendingCardStatus({
  tone,
  icon,
  children,
}: {
  tone: StatusTone;
  icon: ReactNode;
  children: ReactNode;
}) {
  return <span className={cn(
    "inline-flex min-w-20 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium leading-4",
    statusTones[tone],
  )}>
    {icon}
    {children}
  </span>;
}
