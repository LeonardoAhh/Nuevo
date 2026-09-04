"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { motion } from "framer-motion";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import { useRole } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { GUIDE_COPY } from "./guide-steps";
import { useEvaluationReducedMotion } from "./use-evaluation-motion";

export const mockupStyles = {
  card: "space-y-3 rounded-lg border bg-card p-3 shadow-sm",
  field: "flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground",
  action: "inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium",
  primary: "border-primary bg-primary text-primary-foreground",
  line: "h-2 rounded-full bg-muted-foreground/20",
} as const;

export function GuideMockupFrame({ scene, children }: { scene: string; children: ReactNode }) {
  const reducedMotion = useEvaluationReducedMotion();
  const { isEvaluador } = useRole();
  const pages = ["evaluation", "pending", ...(!isEvaluador ? ["saved" as const] : [])] as const;

  return (
    <figure>
      {/* Decorative preview: instructions outside the frame describe the real controls. */}
      <div aria-hidden="true" className="pointer-events-none mx-auto w-full max-w-md overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="flex items-center gap-2 border-b bg-card px-3 py-2">
          <span className="size-2 shrink-0 rounded-full bg-primary" />
          <span className="min-w-0 text-xs font-medium text-foreground">{DESEMPENO.title}</span>
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-1.5">
            <div className="grid min-w-0 flex-1 grid-flow-col auto-cols-fr gap-1">
              {pages.map(key => (
                <span key={key} className={cn(mockupStyles.action, "min-w-0 px-1", key === "evaluation" ? mockupStyles.primary : "bg-card text-foreground")}>
                  {DESEMPENO.pages[key].title}
                </span>
              ))}
            </div>
            <span className={cn(mockupStyles.action, "shrink-0 bg-card text-foreground")}>
              <CircleHelp className="size-3.5" />
              <span className="hidden sm:inline">{DESEMPENO.actions.guide}</span>
            </span>
          </div>
          <motion.div
            key={scene}
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-0"
          >
            {children}
          </motion.div>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">{GUIDE_COPY.preview}</figcaption>
    </figure>
  );
}
