"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, FolderOpen, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/hooks";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import { evaluationStyles } from "./presentation";
const navigation = [{
  key: "evaluation",
  href: DESEMPENO.routes.home,
  icon: SquarePen
}, {
  key: "pending",
  href: DESEMPENO.routes.pending,
  icon: ClipboardList
}, {
  key: "saved",
  href: DESEMPENO.routes.saved,
  icon: FolderOpen
}] as const;
export function EvaluationWorkspace({
  section,
  actions,
  children
}: {
  section: keyof typeof DESEMPENO.pages;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const {
    isEvaluador
  } = useRole();
  return <div className={evaluationStyles.page}>
    <header className="flex items-center justify-between gap-1.5 sm:gap-3 print:hidden">
      <nav aria-label="Evaluación de desempeño" className="grid min-w-0 flex-1 grid-flow-col auto-cols-fr gap-1.5 sm:flex sm:flex-none sm:gap-2">
        {navigation.filter(item => item.key !== "saved" || !isEvaluador).map(({
          key,
          href,
          icon: Icon
        }) => <Button key={key} asChild variant={section === key ? "default" : "outline"} className="min-w-0 gap-1 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">
            <Link href={href} aria-current={section === key ? "page" : undefined}>
              <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
              {DESEMPENO.pages[key].title}
            </Link>
          </Button>)}
      </nav>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
    {children}
  </div>;
}
