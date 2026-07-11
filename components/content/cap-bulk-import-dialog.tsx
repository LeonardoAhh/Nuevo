"use client"
import React, { useState } from "react"
import { Upload, FileJson, Search, CheckCircle2, AlertCircle, AlertTriangle, Layers, Loader2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
  
  // Estado local para animación de procesamiento (Skeletons)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulatedParse = () => {
    setIsSimulating(true)
    setTimeout(() => {
      onParse()
      setIsSimulating(false)
    }, 600)
  }

  // Interceptamos la carga de archivo para mostrar la animación antes de que el JSON se pegue y lo analicemos
  const handleSimulatedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(e)
    setIsSimulating(true)
    setTimeout(() => {
      setIsSimulating(false)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-background">
        <DialogHeader className="flex-shrink-0 p-6 border-b bg-card">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Layers className="h-6 w-6 text-primary" />
            Carga masiva de cursos
          </DialogTitle>
          <DialogDescription className="text-base">
            Importa múltiples cursos de forma simultánea desde un archivo de formato JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              <label
                htmlFor="file-upload"
                className="border-2 border-dashed border-border/60 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20 hover:bg-muted/50 hover:border-primary transition-all group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              >
                <div className="rounded-full bg-background p-4 shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                  <FileJson className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Seleccionar un archivo JSON</h3>
                <p className="text-sm text-muted-foreground mt-1">O arrastra y suelta tu archivo aquí (.json)</p>
                <input 
                  id="file-upload" 
                  ref={fileRef} 
                  type="file" 
                  accept=".json,application/json" 
                  onChange={handleSimulatedFile} 
                  className="sr-only" 
                  aria-label="Subir archivo JSON"
                />
              </label>

              <div className="flex items-center gap-4">
                <Separator className="flex-1 bg-border/60" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">o copia y pega</span>
                <Separator className="flex-1 bg-border/60" />
              </div>

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
                  className="w-full rounded-xl border border-input bg-muted/30 text-foreground p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary shadow-inner placeholder:text-muted-foreground/60 transition-shadow"
                  aria-label="Contenido JSON"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSimulatedParse} 
                  disabled={!text.trim()} 
                  className="px-6 h-11 rounded-full shadow-sm text-sm font-medium transition-transform active:scale-95"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Analizar JSON
                </Button>
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
              <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                <div className="bg-muted/40 border-b p-4 grid grid-cols-6 gap-4">
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

              <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                <div className="overflow-y-auto max-h-[50vh]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0 z-10 shadow-sm">
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
                                className={`h-9 font-mono text-sm bg-background/50 focus:bg-background ${noEmp ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-label={`Número de empleado fila ${row.id}`}
                              />
                              {noEmp && (
                                <p className="text-xs text-destructive mt-1 font-medium truncate flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> {row.numero ? 'No encontrado' : 'Falta número'}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="p-2 align-middle">
                              <Select value={row.courseId ?? ''} onValueChange={v => onSelectCourse(row.id, v)}>
                                <SelectTrigger className="h-9 text-sm bg-background/50 focus:bg-background" aria-label={`Curso fila ${row.id}`}>
                                  <SelectValue placeholder={row.cursoRaw || 'Selecciona curso'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[40vh]">
                                  {courses.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!row.courseId && row.cursoRaw && (
                                <p className="text-xs text-destructive mt-1 font-medium truncate flex items-center gap-1" title={row.cursoRaw}>
                                  <AlertCircle className="h-3 w-3" /> No reconocido: {row.cursoRaw}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="p-2 align-middle">
                              <Input
                                type="date"
                                value={row.fecha}
                                onChange={e => onUpdateRow(row.id, 'fecha', e.target.value)}
                                className="h-9 text-sm bg-background/50 focus:bg-background"
                                aria-label={`Fecha fila ${row.id}`}
                              />
                            </TableCell>
                            <TableCell className="p-2 align-middle">
                              <Input
                                type="number" min="0" max="100"
                                value={row.calificacion}
                                onChange={e => onUpdateRow(row.id, 'calificacion', e.target.value)}
                                className="h-9 text-sm bg-background/50 focus:bg-background text-center"
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

        {(rows.length > 0 || success !== null) && !isSimulating && (
          <DialogFooter className="flex-shrink-0 p-4 border-t bg-card">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="px-6 h-10 rounded-full"
            >
              {success !== null ? 'Cerrar' : 'Cancelar'}
            </Button>
            {rows.length > 0 && (
              <Button
                onClick={onImport}
                disabled={isReadOnly || saving || validCount === 0}
                className="px-6 h-10 rounded-full shadow-sm relative overflow-hidden transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {validCount} registros
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
