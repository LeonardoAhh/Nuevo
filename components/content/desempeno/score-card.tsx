"use client";

import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent } from "@/components/ui/card";
export function ScoreCard({
  context
}: {
  context: EvaluationFormContext;
}) {
  const {
    ponderacion
  } = context;
  return <Card className="text-center">
    <CardContent className="pb-6 pt-6">
      <div className="text-5xl sm:text-6xl font-bold text-primary" aria-live="polite" aria-atomic="true">
        {ponderacion.calificacionFinal}%
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong>Calificación del periodo</strong>
      </p>
    </CardContent>
  </Card>;
}
