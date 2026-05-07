"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, FileText, CheckSquare, Square, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { useCapacitacion } from "@/lib/hooks"
import type { Employee } from "@/lib/hooks"
import { getTipoCursoByName } from "@/lib/catalogo"
import { notify } from "@/lib/notify"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export default function ReportesContent() {
  const { fetchEmployees, fetchEmployeeProgress } = useCapacitacion()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reportes de Colaboradores</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Busca y selecciona colaboradores para descargar el reporte de cursos asignados, tomados y pendientes.
          </p>
        </div>
        <Button 
          onClick={handleDownload} 
          disabled={selected.size === 0 || generating}
          className="w-full sm:w-auto"
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {generating ? "Generando PDF..." : `Descargar PDF (${selected.size})`}
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm flex flex-col h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)] min-h-[400px]">
        <CardHeader className="p-4 border-b border-border/50 bg-muted/20 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, número o puesto..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full bg-background"
              />
            </div>
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={toggleSelectAll} className="h-9 w-full sm:w-auto">
                {selected.size === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="mr-2 h-4 w-4" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {selected.size === filtered.length && filtered.length > 0 ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto bg-background scrollbar-thin">
          {loading ? (
            <div className="flex justify-center items-center h-full min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center items-center h-full min-h-[200px] text-muted-foreground">
              <p>No se encontraron colaboradores.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map(emp => (
                <div 
                  key={emp.id} 
                  className={`flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors cursor-pointer ${selected.has(emp.id) ? 'bg-muted/30' : ''}`}
                  onClick={() => toggleSelect(emp.id)}
                >
                  <Checkbox 
                    checked={selected.has(emp.id)} 
                    onCheckedChange={() => toggleSelect(emp.id)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{emp.nombre}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground/70">Nº:</span> {emp.numero || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground/70">Puesto:</span> {emp.puesto || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-foreground/70">Depto:</span> {emp.departamento || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
