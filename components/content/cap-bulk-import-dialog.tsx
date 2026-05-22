"use client"
import React from "react"
import { Upload, FileJson, Search, CheckCircle2, AlertCircle, AlertTriangle, Layers, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Course } from "@/lib/hooks"
import type { BulkCourseRow } from "@/lib/capacitacion/types"

interface CapBulkImportDialogProps {
  open: boolean
  text: string
  parseError: string | null
  rows: BulkCourseRow[]
  saving: boolean
  error: string | null
  success: number | null
  fileRef: React.RefObject<HTMLInputElement | null>
  courses: Course[]
  isReadOnly: boolean
  onOpenChange: (open: boolean) => void
  onTextChange: (text: string) => void
  onParse: () => void
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpdateRow: (id: number, field: 'numero' | 'fecha' | 'calificacion', value: string) => void
  onSelectCourse: (id: number, courseId: string) => void
  onImport: () => void
  onBack: () => void
}

export function CapBulkImportDialog({
  open, text, parseError, rows, saving, error, success, fileRef,
  courses, isReadOnly,
  onOpenChange, onTextChange, onParse, onFile, onUpdateRow, onSelectCourse, onImport, onBack,
}: CapBulkImportDialogProps) {
  const validCount   = rows.filter(r => r.employeeId && r.courseId).length
  const invalidCount = rows.length - validCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Carga masiva de cursos
          </DialogTitle>
          <DialogDescription>
            Importa cursos tomados por múltiples empleados desde un archivo JSON.
          </DialogDescription>
        </DialogHeader>

        {success !== null && (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              {success} registros importados correctamente.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Fase 1: entrada JSON */}
        {rows.length === 0 && success === null && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Formato esperado:</p>
              <pre className="text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">{`[
  { "numero": "1234", "curso": "Seguridad Industrial", "fecha": "2025-03-15", "calificacion": 85 },
  { "numero": "5678", "curso": "Calidad Total", "fecha": "2025-04-01" }
]`}</pre>
            </div>

            {parseError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileJson className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Haz clic para seleccionar un archivo JSON</p>
              <p className="text-xs text-muted-foreground mt-1">Solo archivos .json</p>
              <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-muted" />
              <span className="text-xs text-muted-foreground">o pega el JSON</span>
              <Separator className="flex-1 bg-muted" />
            </div>

            <textarea
              value={text}
              onChange={e => onTextChange(e.target.value)}
              placeholder='[{ "numero": "1234", "curso": "...", "fecha": "2025-01-01", "calificacion": 90 }]'
              rows={6}
              className="w-full rounded-xl border bg-muted text-foreground p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex justify-end">
              <Button size="icon" onClick={onParse} disabled={!text.trim()} aria-label="Previsualizar" title="Previsualizar">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Fase 2: preview editable */}
        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-muted-foreground">{rows.length} registros</span>
              <span className="text-success font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {validCount} válidos
              </span>
              {invalidCount > 0 && (
                <span className="text-warning font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {invalidCount} con errores
                </span>
              )}
            </div>

            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-y-auto max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/50 sticky top-0 z-10">
                      <TableHead className="w-20">N.N.</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead className="w-32">Fecha</TableHead>
                      <TableHead className="w-24">Cal.</TableHead>
                      <TableHead className="w-8 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(row => {
                      const isOk  = !!(row.employeeId && row.courseId)
                      const noEmp = !row.employeeId
                      return (
                        <TableRow key={row.id} className={isOk ? '' : 'bg-warning/5'}>
                          <TableCell className="p-1.5">
                            <Input
                              value={row.numero}
                              onChange={e => onUpdateRow(row.id, 'numero', e.target.value)}
                              className="h-8 font-mono text-xs bg-muted text-foreground"
                            />
                          </TableCell>
                          <TableCell className="p-1.5 max-w-[140px]">
                            <span className={`text-xs leading-tight block truncate ${noEmp ? 'text-destructive font-medium' : 'text-foreground'}`}>
                              {noEmp
                                ? (row.numero ? `"${row.numero}" no encontrado` : 'Sin número')
                                : row.employeeName}
                            </span>
                          </TableCell>
                          <TableCell className="p-1.5 min-w-[160px]">
                            <Select value={row.courseId ?? ''} onValueChange={v => onSelectCourse(row.id, v)}>
                              <SelectTrigger className="h-8 text-xs bg-muted text-foreground">
                                <SelectValue placeholder={row.cursoRaw || 'Selecciona curso'} />
                              </SelectTrigger>
                              <SelectContent className="bg-card max-h-48">
                                {courses.map(c => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!row.courseId && row.cursoRaw && (
                              <p className="text-xs text-warning mt-0.5 truncate" title={row.cursoRaw}>{row.cursoRaw}</p>
                            )}
                          </TableCell>
                          <TableCell className="p-1.5">
                            <Input
                              type="date"
                              value={row.fecha}
                              onChange={e => onUpdateRow(row.id, 'fecha', e.target.value)}
                              className="h-8 text-xs bg-muted text-foreground"
                            />
                          </TableCell>
                          <TableCell className="p-1.5">
                            <Input
                              type="number" min="0" max="100"
                              value={row.calificacion}
                              onChange={e => onUpdateRow(row.id, 'calificacion', e.target.value)}
                              className="h-8 text-xs bg-muted text-foreground"
                            />
                          </TableCell>
                          <TableCell className="p-1.5 text-center">
                            {isOk
                              ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                              : <AlertTriangle className="h-4 w-4 text-warning mx-auto" />}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <button
              className="text-xs text-muted-foreground underline hover:text-foreground"
              onClick={onBack}
            >
              ← Volver a editar JSON
            </button>
          </div>
        )}

        {(rows.length > 0 || success !== null) && (
          <DialogFooter>
            <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} aria-label={success !== null ? 'Cerrar' : 'Cancelar'} title={success !== null ? 'Cerrar' : 'Cancelar'}>
              <X className="h-4 w-4" />
            </Button>
            {rows.length > 0 && (
              <Button
                size="icon"
                onClick={onImport}
                disabled={isReadOnly || saving || validCount === 0}
                aria-label={`Importar ${validCount} registros`}
                title={`Importar ${validCount} registros`}
              >
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Upload className="h-4 w-4" />
                }
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
