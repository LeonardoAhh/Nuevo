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
      <header className="flex shrink-0 items-start gap-3 border-b p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="break-words text-base font-semibold leading-snug">{empleadoSel.nombre}</h2>
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={close} aria-label={SAVED_DETAIL.close}>
          <X aria-hidden="true" />
        </Button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 safe-bottom-content">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-mono">{empleadoSel.numero}</span>
          {" · "}{empleadoSel.puesto || "—"}
        </p>
        <p className="mb-3 text-xs font-medium tabular-nums text-muted-foreground">{SAVED_DETAIL.count(empleadoSel.evals.length)}</p>
        {empleadoSel.evals.length ? <ul className="space-y-3">
          {empleadoSel.evals.map(ev => <li key={ev.id}>
            <SavedEvaluationCard evaluation={ev} actions={context} />
          </li>)}
        </ul> : <p className="py-4 text-sm text-muted-foreground">{SAVED_DETAIL.empty}</p>}
      </div>
    </ResponsiveShell>
  );
}
