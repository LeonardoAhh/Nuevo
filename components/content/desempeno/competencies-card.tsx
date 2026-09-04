"use client";

import { evaluationStyles, SectionTitle } from "./presentation";
import { EVALUATION_WEIGHTS, DESEMPENO } from "@/lib/desempeno/presentation";

import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditButton } from "./form-controls";
export function CompetenciesCard({
  context
}: {
  context: EvaluationFormContext;
}) {
  const {
    data,
    ponderacion,
    canEdit,
    faltaEvaluador,
    openModal
  } = context;
  return <Card>
    <CardHeader className="pb-3">
      <div className={evaluationStyles.sectionHeader}>
        <SectionTitle>{`${DESEMPENO.sections.competencias} (${EVALUATION_WEIGHTS.competencias * 100}%)`}</SectionTitle>
        <EditButton section="competencias" canEdit={canEdit} isDisabled={faltaEvaluador} openModal={openModal} />
    </div>
      <p className={evaluationStyles.description}>{DESEMPENO.descriptions.competencias}</p>
  </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">Evaluación de Competencias Blandas</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Competencia</TableHead>
              <TableHead className={evaluationStyles.tableNumber}>Cal.</TableHead>
              <TableHead className={evaluationStyles.tableNumber}>%</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {data.competencias.map((comp, idx) => <TableRow key={idx}>
                <TableCell>{comp.nombre}</TableCell>
                <TableCell>{comp.calificacion}/4</TableCell>
                <TableCell>{Math.round(comp.calificacion / 4 * 100)}%</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>
      <div className={evaluationStyles.summary}>
        <span>Resultado promedio: {ponderacion.promedioParte3}%</span>
        <span>Ponderado: {ponderacion.ponderadoParte3}%</span>
    </div>
  </CardContent>
</Card>;
}
