import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import EvaluatorAssignments from "@/components/content/desempeno/evaluator-assignments"

export const metadata: Metadata = { title: "Asignaciones de evaluación" }

export default function EvaluatorAssignmentsPage() {
  return <Dashboard pageTitle="Asignaciones de evaluación" content={<EvaluatorAssignments />} />
}
