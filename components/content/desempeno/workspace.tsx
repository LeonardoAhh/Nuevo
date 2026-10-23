"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, FolderOpen, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/hooks";
import { DESEMPENO } from "@/lib/desempeno/presentation";
import { evaluationStyles } from "./presentation";
import { useRouter } from "next/navigation";
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
  confirmNavigation,
  children
}: {
  section: keyof typeof DESEMPENO.pages;
  actions?: ReactNode;
  confirmNavigation?: () => Promise<boolean>;
  children: ReactNode;
}) {
  const {
    isEvaluador
  } = useRole();
  const router = useRouter();
  return <div className={evaluationStyles.page}>
    <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 print:hidden">
      <nav aria-label="Evaluación de desempeño" className="grid min-w-max flex-1 grid-flow-col auto-cols-fr gap-1.5 sm:flex sm:flex-none sm:gap-2">
        {navigation.filter(item => item.key !== "saved" || !isEvaluador).map(({
          key,
          href,
          icon: Icon
        }) => <Button key={key} asChild variant={section === key ? "default" : "outline"} className="min-h-11 min-w-0 gap-1 px-2 text-sm font-medium sm:gap-2 sm:px-4">
            <Link href={href} aria-current={section === key ? "page" : undefined} onNavigate={confirmNavigation ? event => {
              event.preventDefault();
              void confirmNavigation().then(confirmed => {
                if (confirmed) router.push(href);
              });
            } : undefined}>
              <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
              {DESEMPENO.pages[key].title}
            </Link>
          </Button>)}
      </nav>
      {actions && <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </header>
    {children}
  </div>;
}
