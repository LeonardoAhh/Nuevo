import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Uses the application's rem spacing, density, font scale and semantic colors. */
export const evaluationStyles = {
  page: "mx-auto w-full min-w-0 max-w-7xl space-y-6",
  stack: "space-y-4",
  sectionTitle: "text-base font-semibold leading-snug tracking-tight text-foreground",
  description: "text-sm leading-relaxed text-muted-foreground",
  caption: "text-xs leading-relaxed text-muted-foreground",
  actions: "flex flex-wrap items-center gap-2",
  sectionHeader: "flex flex-wrap items-start justify-between gap-3",
  tableNumber: "w-28 tabular-nums",
  summary: "mt-4 flex flex-wrap justify-between gap-3 border-t pt-4 text-sm font-semibold"
} as const;
export function SectionTitle({
  className,
  ...props
}: ComponentProps<"h2">) {
  return <h2 className={cn(evaluationStyles.sectionTitle, className)} {...props} />;
}
export function FieldValue({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return <dl className="min-w-0 space-y-2"><dt className={evaluationStyles.description}>{label}</dt><dd className="break-words text-base text-foreground">{children}</dd></dl>;
}
