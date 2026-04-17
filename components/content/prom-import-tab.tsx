"use client"

import React from "react"
import { Upload } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { ReglaPromocionJSON, DatosPromocionJSON } from "@/lib/promociones/types"

// ─── Preview de Reglas ─────────────────────────────────────────────────────

export interface PromReglasPreviewProps {
  reglasPreview: ReglaPromocionJSON[]
  cargando: boolean
  isReadOnly: boolean
  onClose: () => void
  onConfirmar: () => void
}

export function PromReglasPreview({
  reglasPreview,
  cargando,
  isReadOnly,
  onClose,
  onConfirmar,
}: PromReglasPreviewProps) {
  return (
    <ResponsiveShell
      open
      onClose={onClose}
      maxWidth="sm:max-w-3xl"
      title="Vista previa — Reglas de Promoción"
      description={`${reglasPreview.length} regla${reglasPreview.length !== 1 ? "s" : ""}`}
    >
      <ModalToolbar
        title="Reglas de Promoción"
        subtitle={`${reglasPreview.length} regla${reglasPreview.length !== 1 ? "s" : ""} a cargar`}
        saving={cargando}
        onClose={onClose}
        onConfirm={onConfirmar}
        confirmIcon={<Upload size={16} />}
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Si ya existe una regla para el mismo puesto, será reemplazada.
        </p>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted text-xs">
                <TableHead>Puesto Actual</TableHead>
                <TableHead>Promoción a</TableHead>
                <TableHead className="text-center">Temporalidad</TableHead>
                <TableHead className="text-center">Examen</TableHead>
                <TableHead className="text-center">Cursos %</TableHead>
                <TableHead className="text-center">Evaluación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reglasPreview.map((r) => (
                <TableRow key={r["Puesto Actual"]} className="text-sm">
                  <TableCell className="font-medium">{r["Puesto Actual"]}</TableCell>
                  <TableCell className="text-muted-foreground">{r["Promoción a"]}</TableCell>
                  <TableCell className="text-center">{r["Temporalidad (meses)"]} meses</TableCell>
                  <TableCell className="text-center">{r["Calificación Examen Teorico"]}</TableCell>
                  <TableCell className="text-center">{r["Cumplimiento Cursos Asigandos"]}%</TableCell>
                  <TableCell className="text-center">{r["Calificación Evaluación Desempeño"]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ResponsiveShell>
  )
}

// ─── Preview de Datos de Empleados ─────────────────────────────────────────

export interface PromDatosPreviewProps {
  datosPreview: DatosPromocionJSON[]
  datosCargando: boolean
  isReadOnly: boolean
  onClose: () => void
  onConfirmar: () => void
}

export function PromDatosPreview({
  datosPreview,
  datosCargando,
  isReadOnly,
  onClose,
  onConfirmar,
}: PromDatosPreviewProps) {
  return (
    <ResponsiveShell
      open
      onClose={onClose}
      maxWidth="sm:max-w-3xl"
      title="Vista previa — Datos de Empleados"
      description={`${datosPreview.length} registro${datosPreview.length !== 1 ? "s" : ""}`}
    >
      <ModalToolbar
        title="Datos de Empleados"
        subtitle={`${datosPreview.length} registro${datosPreview.length !== 1 ? "s" : ""} a cargar`}
        saving={datosCargando}
        onClose={onClose}
        onConfirm={onConfirmar}
        confirmIcon={<Upload size={16} />}
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          El enlace es por <strong>N.N</strong> (número de empleado). Si ya existe un registro se actualizará.
        </p>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted text-xs">
                <TableHead>N.N</TableHead>
                <TableHead>Fecha Inicio Puesto</TableHead>
                <TableHead className="text-center">Desempeño %</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-center">Examen %</TableHead>
                <TableHead className="text-center">Intentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosPreview.map((r) => (
                <TableRow key={r["N.N"]} className="text-sm">
                  <TableCell className="font-mono font-medium">{r["N.N"]}</TableCell>
                  <TableCell>{r["Fecha Inicio Puesto"] || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell className="text-center">
                    <span className={r["Desempeño Actual (%)"] && parseFloat(r["Desempeño Actual (%)"]) > 0
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"}>
                      {r["Desempeño Actual (%)"] || "—"}
                    </span>
                  </TableCell>
                  <TableCell>{r["Periodo de Evaluación"] || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell className="text-center">
                    {r["Última Calificación Examen (%)"]
                      ? <span className="font-semibold">{r["Última Calificación Examen (%)"]}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">{r["Intentos de Examen"]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ResponsiveShell>
  )
}
