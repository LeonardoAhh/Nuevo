"use client";

import { evaluationStyles, SectionTitle } from "./presentation";
import { EVALUATION_WEIGHTS, DESEMPENO } from "@/lib/desempeno/presentation";

import type { EvaluationFormContext } from "./use-evaluation-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditButton } from "./form-controls";
export function ObjectivesCard({
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
        <SectionTitle>{`${DESEMPENO.sections.objetivos} (${EVALUATION_WEIGHTS.objetivos * 100}%)`}</SectionTitle>
        <EditButton section="objetivos" canEdit={canEdit} isDisabled={faltaEvaluador} openModal={openModal} />
      </div>
      <p className={evaluationStyles.description}>{DESEMPENO.descriptions.objetivos}</p>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">Evaluación de Objetivos SMART</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Objetivos SMART</TableHead>
              <TableHead>Objetivos</TableHead>
              <TableHead className={evaluationStyles.tableNumber}>% Obtenido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.objetivos.map((obj, i) => <TableRow key={i}>
                <TableCell className="text-muted-foreground">{obj.numero}</TableCell>
                <TableCell>{obj.descripcion}</TableCell>
                <TableCell>{obj.resultado}</TableCell>
                <TableCell>{obj.porcentaje}</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <div className={evaluationStyles.summary}>
        <span>Resultado promedio: {ponderacion.promedioParte1}%</span>
        <span>Ponderado: {ponderacion.ponderadoParte1}%</span>
      </div>
    </CardContent>
  </Card>;
}
