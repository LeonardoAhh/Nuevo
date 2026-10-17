"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveShell } from "@/components/ui/responsive-shell";
import { SavedEvaluationCard } from "./saved-evaluation-card";
import { SAVED_DETAIL } from "./saved-detail-copy";
import type { SavedEvaluationsContext } from "./use-saved-evaluations";

export function SavedDetail({ context }: { context: SavedEvaluationsContext }) {
  const { empleadoSel, setSelectedNumero } = context;
  if (!empleadoSel) return null;
  const close = () => setSelectedNumero(null);

  return (
    <ResponsiveShell open={!!empleadoSel} onClose={close} title={`${SAVED_DETAIL.title}: ${empleadoSel.nombre}`} description={SAVED_DETAIL.description} maxWidth="sm:max-w-lg">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="min-w-0 flex-1 break-words text-xl font-semibold leading-7 tracking-tight text-foreground">{empleadoSel.nombre}</h2>
        <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 shrink-0" onClick={close} aria-label={SAVED_DETAIL.close}>
          <X aria-hidden="true" />
        </Button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 safe-bottom-content">
        <div className="mb-4 min-w-0 space-y-1">
          <p className="text-sm leading-5 tabular-nums text-muted-foreground">{empleadoSel.numero}</p>
          <p className="truncate text-sm leading-5 text-muted-foreground" title={empleadoSel.puesto || undefined}>{empleadoSel.puesto || "—"}</p>
        </div>
        {empleadoSel.evals.length ? <ul className="space-y-3">
          {empleadoSel.evals.map(ev => <li key={ev.id}>
            <SavedEvaluationCard evaluation={ev} actions={context} />
          </li>)}
        </ul> : <p className="py-4 text-sm text-muted-foreground">{SAVED_DETAIL.empty}</p>}
      </div>
    </ResponsiveShell>
  );
}
