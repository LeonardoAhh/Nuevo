"use client"

import { useState, useEffect, useMemo, useId } from "react"
import { Search, FileText, CheckSquare, Square, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { useCapacitacion } from "@/lib/hooks"
import type { Employee } from "@/lib/hooks"
import { getTipoCursoByName } from "@/lib/catalogo"
import { notify } from "@/lib/notify"
import { addReportFooter } from "@/lib/pdf-footer"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ReportesContent() {
  const { fetchEmployees, fetchEmployeeProgress } = useCapacitacion()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const searchId = useId()

  useEffect(() => {
    loadEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const data = await fetchEmployees()
      setEmployees(data)
    } catch (err) {
      console.error(err)
      notify.error("Error al cargar empleados")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return employees
    const s = search.toLowerCase()
    return employees.filter(e => 
      e.nombre.toLowerCase().includes(s) || 
      (e.numero && e.numero.toLowerCase().includes(s)) ||
      (e.puesto && e.puesto.toLowerCase().includes(s))
    )
  }, [employees, search])

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(e => e.id)))
    }
  }

  const handleDownload = async () => {
    if (selected.size === 0) return
    setGenerating(true)
    try {
      const doc = new jsPDF()
      const selectedIds = Array.from(selected)
      
      for (let i = 0; i < selectedIds.length; i++) {
        const empId = selectedIds[i]
        const emp = employees.find(e => e.id === empId)
        if (!emp) continue

        if (i > 0) doc.addPage()

        const progress = await fetchEmployeeProgress(emp)

        // Banner Header
        doc.setFillColor(30, 41, 59) // slate-800
        doc.rect(0, 0, 210, 24, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Reporte de Capacitación", 14, 15)
        
        // Employee info
        doc.setTextColor(15, 23, 42) // slate-900
        doc.setFontSize(18)
        doc.setFont("helvetica", "bold")
        doc.text(emp.nombre, 14, 38)
        
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(71, 85, 105) // slate-500
        doc.text(`Nº Empleado: ${emp.numero || "N/A"}`, 14, 46)
        doc.text(`Puesto: ${emp.puesto || "N/A"}`, 14, 52)
        doc.text(`Departamento: ${emp.departamento || "N/A"}`, 14, 58)
        
        // Progress Summary
        doc.setFillColor(241, 245, 249) // slate-100
        doc.rect(14, 66, 182, 14, "F")
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(`Requeridos: ${progress.totalRequired}`, 20, 75)
        doc.setTextColor(22, 163, 74) // green-600
        doc.text(`Aprobados: ${progress.aprobados}`, 65, 75)
        doc.setTextColor(220, 38, 38) // red-600
        doc.text(`Reprobados: ${progress.reprobados}`, 115, 75)
        doc.setTextColor(234, 88, 12) // orange-600
        doc.text(`Pendientes: ${progress.pendientes}`, 165, 75)

        // Group courses by type
        const byType: Record<string, typeof progress.courses> = {}
        progress.courses.forEach(c => {
          const t = c.course?.tipo || getTipoCursoByName(c.courseName)
          if (!byType[t]) byType[t] = []
          byType[t].push(c)
        })

        let startY = 88
        
        Object.keys(byType).sort().forEach(tipo => {
          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(30, 41, 59)
          doc.text(tipo.toUpperCase(), 14, startY)
          
          const tableData = byType[tipo].map(c => [
            c.courseName,
            c.status === "aprobado" ? "Aprobado" : c.status === "reprobado" ? "Reprobado" : "Pendiente",
            c.calificacion !== null ? c.calificacion.toString() : "-",
            c.fechaAplicacion ? new Date(c.fechaAplicacion).toLocaleDateString("es-MX", { timeZone: 'UTC' }) : "-"
          ])

          autoTable(doc, {
            startY: startY + 4,
            head: [["Curso", "Estatus", "Calificación", "Fecha Aplicación"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            margin: { left: 14, right: 14 },
            columnStyles: {
              0: { cellWidth: 90 },
              1: { cellWidth: 30 },
              2: { cellWidth: 28, halign: "center" },
              3: { cellWidth: 34, halign: "center" }
            },
            willDrawCell: function(data: any) {
              if (data.section === 'body' && data.column.index === 1) {
                if (data.cell.raw === 'Aprobado') {
                  data.cell.styles.textColor = [22, 163, 74] // green
                } else if (data.cell.raw === 'Reprobado') {
                  data.cell.styles.textColor = [220, 38, 38] // red
                } else {
                  data.cell.styles.textColor = [234, 88, 12] // orange
                }
                data.cell.styles.fontStyle = 'bold'
              }
            }
          })
          
          startY = (doc as any).lastAutoTable.finalY + 12
        })
      }
      
      addReportFooter(doc)
      const fileName = `Reporte_Capacitacion_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
      notify.success("Reporte generado exitosamente")
    } catch (err) {
      console.error(err)
      notify.error("Error al generar el reporte")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10">
      <Card className="border-border">
        <CardHeader className="flex-shrink-0 border-b border-border/50 bg-muted/20 p-4 sm:p-6">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <label htmlFor={searchId} className="sr-only">
                Buscar por nombre, número o puesto
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id={searchId}
                placeholder="Buscar por nombre, número o puesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 min-h-11 bg-background pl-10 text-sm"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="h-11 min-h-11 w-full px-3 py-0 text-sm sm:w-auto"
              >
                {selected.size === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="mr-2 h-4 w-4" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {selected.size === filtered.length && filtered.length > 0 ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Button>
            </div>
            <Button
              onClick={handleDownload}
              disabled={selected.size === 0 || generating}
              className="h-11 min-h-11 w-full px-3 py-0 text-sm font-medium sm:w-auto"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {generating ? "Generando PDF..." : `Descargar PDF (${selected.size})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              <p>No se encontraron colaboradores.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2">
              {filtered.map((emp) => (
                <li key={emp.id} className="border-b border-border/50 md:odd:border-r md:odd:border-r-border/50">
                  <button
                    type="button"
                    aria-label={`Seleccionar a ${emp.nombre}`}
                    aria-pressed={selected.has(emp.id)}
                    onClick={() => toggleSelect(emp.id)}
                    className={`flex h-full min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-4 sm:px-6 ${selected.has(emp.id) ? "bg-muted/30" : ""}`}
                  >
                    {selected.has(emp.id) ? (
                      <CheckSquare className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    ) : (
                      <Square className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{emp.nombre}</span>
                      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground/70">Nº:</span> {emp.numero || "N/A"}
                        </span>
                        <span>
                          <span className="font-medium text-foreground/70">Puesto:</span> {emp.puesto || "N/A"}
                        </span>
                        <span>
                          <span className="font-medium text-foreground/70">Depto:</span> {emp.departamento || "N/A"}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
