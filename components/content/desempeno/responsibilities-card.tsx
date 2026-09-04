"use client";

import { evaluationStyles, SectionTitle } from "./presentation";
import { EVALUATION_WEIGHTS, DESEMPENO } from "@/lib/desempeno/presentation";

import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditButton } from "./form-controls";
export function ResponsibilitiesCard({
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
        <SectionTitle>{`${DESEMPENO.sections.cumplimiento} (${EVALUATION_WEIGHTS.cumplimiento * 100}%)`}</SectionTitle>
        <EditButton section="cumplimiento" canEdit={canEdit} isDisabled={faltaEvaluador} openModal={openModal} />
      </div>
      <p className={evaluationStyles.description}>{DESEMPENO.descriptions.cumplimiento}</p>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">Evaluación de Cumplimiento de Responsabilidades</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Responsabilidad</TableHead>
              <TableHead className={evaluationStyles.tableNumber}>% Cump</TableHead>
              <TableHead className={evaluationStyles.tableNumber}>Evalúa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.cumplimiento_responsabilidades.map((item, idx) => <TableRow key={idx}>
                <TableCell>{item.descripcion}</TableCell>
                <TableCell>{item.porcentaje}</TableCell>
                <TableCell>{item.evalua}</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <div className={evaluationStyles.summary}>
        <span>Resultado promedio: {ponderacion.promedioParte2}%</span>
        <span>Ponderado: {ponderacion.ponderadoParte2}%</span>
      </div>
    </CardContent>
  </Card>;
}
