"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Layers, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { usePendingEvals, type EmployeePending } from "@/lib/hooks/usePendingEvals";
import { containerV } from "./pending-presentation";
import { DeptTab } from "./department-filter";
import { DetailModal } from "./pending-detail";
import { EmployeeBadge } from "./pending-employee";
interface MensualProps {
  loading: boolean;
  deptGroups: ReturnType<typeof usePendingEvals>["deptGroups"];
  totalEmployees: number;
  activeTab: string | null;
  onTabChange: (dept: string) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}
export function VistaMensual({
  loading,
  deptGroups,
  totalEmployees,
  activeTab,
  onTabChange,
  selectedId,
  onSelectId
}: MensualProps) {
  const activeGroup = deptGroups.find(g => g.departamento === activeTab) ?? null;
  return <div className="space-y-4">
    {/* All-clear */}
    {!loading && totalEmployees === 0 && <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/5 py-8 text-success">
      <CheckCircle2 size={28} className="opacity-70" />
      <p className="text-sm font-medium">¡Todo al día! Sin evaluaciones pendientes.</p>
    </div>}

    {(loading || deptGroups.length > 0) && <div className="space-y-4">
      {/* Dept tabs */}
      <div role="group" aria-label="Departamentos con evaluaciones pendientes" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {loading ? Array.from({
          length: 4
        }).map((_, i) => <Skeleton key={i} className="h-8 w-28 flex-shrink-0 rounded-md" />) : deptGroups.map(g => <DeptTab key={g.departamento} label={g.departamento} count={g.items.length} isActive={g.departamento === activeTab} onClick={() => onTabChange(g.departamento)} />)}
      </div>

      {/* Badge grid */}
      <AnimatePresence mode="wait">
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({
            length: 8
          }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div> : activeGroup ? <motion.div key={activeGroup.departamento} variants={containerV} initial="hidden" animate="show" exit={{
          opacity: 0,
          transition: {
            duration: 0.15
          }
        }} className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3" aria-hidden="true" />
            <span>
              {activeGroup.items.length} empleado{activeGroup.items.length !== 1 ? "s" : ""}
              {" · "}
              <span className="font-bold text-foreground">{activeGroup.departamento}</span>
            </span>
          </div>

          <div className="space-y-6">
            {(() => {
              const getGroupKey = (item: EmployeePending) => {
                const cleanString = (str: string) => {
                  return str.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                  .replace(/[^A-Z0-9\s]/g, "") // Quitar puntuación (puntos, comas, guiones)
                  .replace(/\s+/g, " ") // Normalizar espacios
                  .trim();
                };
                const parts = [];
                if (item.area && item.area.trim() !== "" && item.area !== "N/A") {
                  parts.push(cleanString(item.area));
                }
                if (item.turno && item.turno.trim() !== "" && item.turno !== "N/A") {
                  const t = cleanString(item.turno);
                  parts.push(t.startsWith("TURNO") ? t : `TURNO ${t}`);
                }
                return parts.length > 0 ? parts.join(" · ") : "GENERAL";
              };
              const grouped = activeGroup.items.reduce((acc, item) => {
                const key = getGroupKey(item);
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {} as Record<string, EmployeePending[]>);
              const sortedKeys = Object.keys(grouped).sort((a, b) => {
                if (a === "GENERAL") return 1;
                if (b === "GENERAL") return -1;
                return a.localeCompare(b, "es");
              });
              return sortedKeys.map(key => <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="size-3.5" aria-hidden="true" />
                    {key}
                    <span className="text-xs font-normal opacity-70">({grouped[key].length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {grouped[key].map(item => <EmployeeBadge key={item.dbId} item={item} isSelected={selectedId === item.dbId} onSelect={() => onSelectId(selectedId === item.dbId ? null : item.dbId)} />)}
                  </div>
                </div>);
            })()}
          </div>

          <Dialog open={!!selectedId} onOpenChange={open => !open && onSelectId(null)}>
            {(() => {
              const current = activeGroup.items.find(i => i.dbId === selectedId);
              return current ? <DetailModal key={current.dbId} item={current} /> : null;
            })()}
          </Dialog>
        </motion.div> : null}
      </AnimatePresence>
    </div>}

    {/* Leyenda */}
    {!loading && totalEmployees > 0 && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
          Vencida
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />
          Pendiente
      </span>
      <span className="text-xs font-semibold text-foreground sm:ml-auto">
          Toca un número para ver el detalle
      </span>
    </div>}
  </div>;
}
