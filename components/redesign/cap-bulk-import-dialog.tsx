"use client"
import React, { useState } from "react"
import { Upload, FileJson, Search, CheckCircle2, AlertCircle, AlertTriangle, Layers, Loader2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "./modal-header"
import { RedesignModalFooter } from "./modal-footer"
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

  // Estado local para animación de procesamiento (Skeletons)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulatedParse = () => {
    setIsSimulating(true)
    setTimeout(() => {
      onParse()
      setIsSimulating(false)
    }, 600)
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={() => onOpenChange(false)}
      title="Cargar cursos"
      maxWidth="sm:max-w-5xl"
    >
      <RedesignModalHeader
        title="Carga masiva de cursos"
        icon={<FileJson className="h-5 w-5" />}
        onClose={() => onOpenChange(false)}
      />

      <div className="flex-1 overflow-y-auto min-h-0 p-6 bg-surface-card">
          {success !== null && (
            <Alert className="border-success/30 bg-success/10 mb-6 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <AlertDescription className="text-success font-medium text-base ml-2">
                ¡{success} registros importados correctamente!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6 shadow-sm">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-sm font-medium ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {/* FASE 1: Entrada JSON (Carga) */}
          {rows.length === 0 && success === null && !isSimulating && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

              <div className="space-y-3 relative">
                {parseError && (
                  <Alert variant="destructive" className="py-2.5 animate-in fade-in slide-in-from-top-1 absolute -top-16 left-0 right-0 z-10 shadow-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2 font-medium">{parseError}</AlertDescription>
                  </Alert>
                )}

                <textarea
                  id="json-input"
                  value={text}
                  onChange={e => onTextChange(e.target.value)}
                  placeholder={'Formato esperado:\n[\n  { "numero": "1234", "curso": "Seguridad Industrial", "fecha": "2025-03-15", "calificacion": 85 }\n]'}
                  rows={6}
                  className="w-full rounded-md border border-border/60 bg-transparent text-foreground p-4 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary shadow-none placeholder:text-muted-foreground/60 transition-shadow"
                  aria-label="Contenido JSON"
                />
              </div>
            </div>
          )}

          {/* FASE INTERMEDIA: Skeletons de Carga */}
          {isSimulating && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Skeleton className="h-7 w-32 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
              <div className="rounded-md border border-border/60 shadow-none bg-surface-card overflow-hidden">
                <div className="bg-transparent border-b border-border/60 p-4 grid grid-cols-6 gap-4">
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-5 w-full rounded-md col-span-2" />
                  <Skeleton className="h-5 w-full rounded-md col-span-2" />
                  <Skeleton className="h-5 w-full rounded-md" />
                </div>
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-6 gap-4 items-center">
                      <Skeleton className="h-9 w-full rounded-md" />
                      <Skeleton className="h-9 w-full rounded-md col-span-2" />
                      <Skeleton className="h-9 w-full rounded-md col-span-2" />
                      <Skeleton className="h-9 w-12 rounded-full mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FASE 2: Preview Editable */}
          {rows.length > 0 && !isSimulating && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm font-medium px-3 py-1 bg-background">
                    {rows.length} registros totales
                  </Badge>
                  <Badge variant="outline" className="text-sm font-medium px-3 py-1 text-success border-success/30 bg-success/10 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {validCount} válidos
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1 text-destructive border-destructive/30 bg-destructive/10 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> {invalidCount} con errores
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium h-9 px-4 rounded-full"
                  onClick={onBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al editor
                </Button>
              </div>

              <div className="rounded-md border border-border/60 shadow-none bg-surface-card overflow-hidden">
                <div className="overflow-y-auto max-h-[50vh]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent sticky top-0 z-10">
                        <TableHead className="w-[15%]">Número</TableHead>
                        <TableHead className="w-[45%]">Curso</TableHead>
                        <TableHead className="w-[20%]">Fecha</TableHead>
                        <TableHead className="w-[10%] text-center">Calif.</TableHead>
                        <TableHead className="w-[10%] text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(row => {
                        const isOk  = !!(row.employeeId && row.courseId)
                        const noEmp = !row.employeeId
                        return (
                          <TableRow key={row.id} className={`group ${isOk ? '' : 'bg-destructive/5 hover:bg-destructive/10 transition-colors'}`}>
                            <TableCell className="p-2 align-middle">
                              <Input
                                value={row.numero}
                                onChange={e => onUpdateRow(row.id, 'numero', e.target.value)}
                                className={`h-9 font-mono text-sm shadow-none rounded-md border-border/60 bg-transparent ${noEmp ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-label={`Número de empleado fila ${row.id}`}
                              />
                              {noEmp && (
                                <p className="text-xs text-destructive mt-1 font-normal truncate flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> {row.numero ? 'No encontrado' : 'Falta número'}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="p-2 align-middle">
                              <Select value={row.courseId ?? ''} onValueChange={v => onSelectCourse(row.id, v)}>
                                <SelectTrigger className="h-9 text-sm shadow-none rounded-md border-border/60 bg-transparent" aria-label={`Curso fila ${row.id}`}>
                                  <SelectValue placeholder={row.cursoRaw || 'Selecciona curso'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[40vh]">
                                  {courses.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!row.courseId && row.cursoRaw && (
                                <p className="text-xs text-destructive mt-1 font-normal truncate flex items-center gap-1" title={row.cursoRaw}>
                                  <AlertCircle className="h-3 w-3" /> No reconocido: {row.cursoRaw}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="p-2 align-middle">
                              <Input
                                type="date"
                                value={row.fecha}
                                onChange={e => onUpdateRow(row.id, 'fecha', e.target.value)}
                                className="h-9 text-sm shadow-none rounded-md border-border/60 bg-transparent"
                                aria-label={`Fecha fila ${row.id}`}
                              />
                            </TableCell>
                            <TableCell className="p-2 align-middle">
                              <Input
                                type="number" min="0" max="100"
                                value={row.calificacion}
                                onChange={e => onUpdateRow(row.id, 'calificacion', e.target.value)}
                                className="h-9 text-sm shadow-none rounded-md border-border/60 bg-transparent text-center"
                                aria-label={`Calificación fila ${row.id}`}
                              />
                            </TableCell>
                            <TableCell className="p-2 align-middle text-center">
                              <div className="flex justify-center">
                                {isOk
                                  ? <CheckCircle2 className="h-5 w-5 text-success opacity-80 group-hover:opacity-100 transition-opacity" aria-label="Fila válida" />
                                  : <AlertTriangle className="h-5 w-5 text-destructive opacity-80 group-hover:opacity-100 transition-opacity" aria-label="Fila con errores" />}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

      <RedesignModalFooter
        onCancel={() => onOpenChange(false)}
        cancelLabel={success !== null ? 'Cerrar' : 'Cancelar'}
        cancelDisabled={saving || isSimulating}
        onConfirm={
          success !== null
            ? undefined
            : rows.length === 0
            ? handleSimulatedParse
            : onImport
        }
        confirmLabel={
          success !== null
            ? ""
            : rows.length === 0
            ? "Analizar JSON"
            : `Importar ${validCount} registros`
        }
        confirmIcon={
          rows.length === 0 ? <Search className="h-4 w-4" /> : <Upload className="h-4 w-4" />
        }
        confirmDisabled={
          success !== null
            ? true
            : rows.length === 0
            ? (!text.trim() || isSimulating)
            : (isReadOnly || saving || validCount === 0 || isSimulating)
        }
        secondaryAction={
          rows.length > 0 && success === null
            ? {
                label: "Volver",
                onClick: onBack,
                disabled: saving || isSimulating,
                icon: <ArrowLeft className="h-4 w-4" />
              }
            : undefined
        }
        saving={saving || isSimulating}
      />
    </ResponsiveShell>
  )
}
