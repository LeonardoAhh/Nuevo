"use client";

import { SectionTitle } from "./desempeno/presentation";
import { EvaluationWorkspace } from "./desempeno/workspace";
import { EASE_OUT } from "./desempeno/pending-presentation";
import { VistaMensual } from "./desempeno/pending-monthly";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, UserPlus, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePendingEvals } from "@/lib/hooks/usePendingEvals";
import { useRole } from "@/lib/hooks";
import { PERIODOS_DESEMPENO } from "@/lib/catalogo";
import DesempenoSemestralPendientes from "./desempeno-semestral-pendientes";
type Vista = "mensual" | "semestral";
interface Props {
  /** Department scope override; defaults to the role's departamentosScope. */
  filterDepartamentos?: string[] | null;
  periodoSemestral?: string;
}
export default function DesempenoPendientes({
  filterDepartamentos,
  periodoSemestral
}: Props = {}) {
  const {
    departamentosScope
  } = useRole();
  const {
    loading,
    deptGroups,
    totalEmployees,
    totalEvals,
    cargar
  } = usePendingEvals(filterDepartamentos ?? departamentosScope);
  const [vista, setVista] = useState<Vista>("mensual");
  // First department acts as the default tab until the user picks one.
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const currentTab = activeTab ?? deptGroups[0]?.departamento ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handleTabChange = (dept: string) => {
    setActiveTab(dept);
    setSelectedId(null);
  };
  return <EvaluationWorkspace section="pending"><Card>
      {/* Header */}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <SectionTitle>Evaluaciones Pendientes</SectionTitle>
            {vista === "mensual" && !loading && totalEmployees > 0 && <p className="mt-0.5 text-xs text-muted-foreground">
                {totalEmployees} empleado{totalEmployees !== 1 ? "s" : ""}
                {" · "}
                {totalEvals} evaluación{totalEvals !== 1 ? "es" : ""}
            </p>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={cargar} disabled={loading} aria-label="Actualizar evaluaciones">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </CardHeader>

      <CardContent className="space-y-4">
        {/* Toggle de vista */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant={vista === "mensual" ? "default" : "outline"} size="sm" onClick={() => setVista("mensual")} aria-pressed={vista === "mensual"} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
              Nuevo Ingreso
        </Button>
          <Button variant={vista === "semestral" ? "default" : "outline"} size="sm" onClick={() => setVista("semestral")} aria-pressed={vista === "semestral"} className="gap-1.5">
            <CalendarRange className="h-3.5 w-3.5" />
              Semestrales
        </Button>
      </div>

        {/* Info banner — solo en vista mensual */}
        {vista === "mensual" && <Alert className="[&>svg~*]:pl-0 [&>svg]:static [&>svg]:translate-y-0 bg-warning/10 text-warning border-warning/30">
          <AlertDescription className="text-xs">
              Desglose por departamento de evaluaciones pendientes de nuevo ingreso
        </AlertDescription>
      </Alert>}

        {/* Contenido por vista */}
        <AnimatePresence mode="wait">
          {vista === "semestral" ? <motion.div key="semestral" initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -4
          }} transition={{
            duration: 0.2,
            ease: EASE_OUT
          }}>
            <DesempenoSemestralPendientes periodo={periodoSemestral ?? PERIODOS_DESEMPENO.semestrales[0]} filterDepartamentos={filterDepartamentos} />
        </motion.div> : <motion.div key="mensual" initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -4
          }} transition={{
            duration: 0.2,
            ease: EASE_OUT
          }}>
            <VistaMensual loading={loading} deptGroups={deptGroups} totalEmployees={totalEmployees} activeTab={currentTab} onTabChange={handleTabChange} selectedId={selectedId} onSelectId={setSelectedId} />
        </motion.div>}
      </AnimatePresence>
    </CardContent>
  </Card></EvaluationWorkspace>;
}
