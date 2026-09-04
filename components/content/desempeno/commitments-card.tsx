"use client";

import { evaluationStyles, SectionTitle } from "./presentation";
import { DESEMPENO } from "@/lib/desempeno/presentation";

import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EditButton, InfoField } from "./form-controls";
export function CommitmentsCard({
  context
}: {
  context: EvaluationFormContext;
}) {
  const {
    data,
    canEdit,
    faltaEvaluador,
    openModal
  } = context;
  return <Card>
    <CardHeader className="pb-3">
      <div className={evaluationStyles.sectionHeader}>
        <SectionTitle>{DESEMPENO.sections.compromisos}</SectionTitle>
        <EditButton section="compromisos" canEdit={canEdit} isDisabled={faltaEvaluador} openModal={openModal} />
    </div>
      <p className={evaluationStyles.description}>{DESEMPENO.descriptions.compromisos}</p>
  </CardHeader>
    <CardContent className="space-y-3 text-sm">
      <InfoField label={DESEMPENO.fields.commitments}>
        <p className="whitespace-pre-line">{data.compromisos || "—"}</p>
    </InfoField>
      <InfoField label={DESEMPENO.fields.reviewDate}>
        <p>{data.fecha_revision || "—"}</p>
    </InfoField>
      <InfoField label={DESEMPENO.fields.observations}>
        <p>{data.observaciones || "—"}</p>
    </InfoField>
  </CardContent>
</Card>;
}
