"use client";

import { SectionTitle } from "./desempeno/presentation";
import { EvaluationWorkspace } from "./desempeno/workspace";
import { useSavedEvaluations } from "./desempeno/use-saved-evaluations";
import { ObjectivesCatalog } from "./desempeno/objectives-catalog";
import { SavedHistory } from "./desempeno/saved-history";
import { SavedDetail } from "./desempeno/saved-detail";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScoreBadge } from "./desempeno-score-badge";
import { PrintInstructionDialog } from "./print-instruction-dialog";
import DesempenoPrint from "./desempeno-print";
export default function DesempenoObjetivos() {
  const context = useSavedEvaluations();
  const {
    puesto,
    showPrintDialog,
    setShowPrintDialog,
    data,
    objetivos,
    hasPuestoObjetivos,
    bloqueado,
    empleadoSel
  } = context;
  return <TooltipProvider>
    <EvaluationWorkspace section="saved">
      <ObjectivesCatalog context={context} />
      <SavedHistory context={context} />

      {/* Print area for selected evaluation */}
      {data && !puesto && <Card className="print:hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SectionTitle className="text-base">Evaluación cargada</SectionTitle>
            <Button variant="outline" size="sm" onClick={() => setShowPrintDialog(true)} disabled={bloqueado}>
              <Printer className="h-4 w-4 mr-1.5" />
              {bloqueado ? "Captura compromisos" : "Imprimir"}
          </Button>
        </div>
      </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Empleado</span>
              <p className="font-semibold">{data.numero_empleado} — {data.nombre}</p>
          </div>
            <div>
              <span className="text-muted-foreground text-xs">Puesto</span>
              <p className="font-semibold">{data.puesto}</p>
          </div>
            <div>
              <span className="text-muted-foreground text-xs">Periodo</span>
              <p className="font-semibold">{data.periodo || "—"}</p>
          </div>
            <div>
              <span className="text-muted-foreground text-xs">Calificación</span>
              <ScoreBadge score={data.calificacion_final} className="text-lg px-3 py-1" />
          </div>
        </div>
      </CardContent>
    </Card>}
      {/* Detalle de evaluaciones del empleado — modal (PC) / sheet (móvil) */}
      {empleadoSel && <SavedDetail context={context} />}

      {/* Hidden print area */}
      {data && <div className="print-area hidden print:block">
        <DesempenoPrint data={data} />
    </div>}

      <PrintInstructionDialog open={showPrintDialog} onOpenChange={setShowPrintDialog} onConfirm={() => window.print()} />
  </EvaluationWorkspace>
</TooltipProvider>;
}
