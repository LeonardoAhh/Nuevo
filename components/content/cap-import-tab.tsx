"use client"
import React from "react"
import { Upload, FileJson, Search, RotateCcw, CheckCircle2, AlertCircle, Building2, Briefcase, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ImportPreview } from "@/lib/hooks"

interface CapImportTabProps {
  jsonText: string
  setJsonText: (v: string) => void
  preview: ImportPreview | null
  parseError: string | null
  importSuccess: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isReadOnly: boolean
  importing: boolean
  importError: string | null
  handleParse: () => void
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleImport: () => void
  handleReset: () => void
}

export function CapImportTab({
  jsonText, setJsonText, preview, parseError, importSuccess,
  fileInputRef, isReadOnly, importing, importError,
  handleParse, handleFileUpload, handleImport, handleReset,
}: CapImportTabProps) {
  return (
    <div className="space-y-4">
      {importSuccess && (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Catálogo importado correctamente a Supabase.
          </AlertDescription>
        </Alert>
      )}
      {(parseError || importError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError || importError}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Cargar catálogo JSON</CardTitle>
          <CardDescription>
            Estructura con{" "}
            <code className="text-xs bg-muted px-1 rounded">position</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">department</code> y{" "}
            <code className="text-xs bg-muted px-1 rounded">requiredCourses_*</code>.
            Los campos vacíos se ignorarán automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileJson className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Arrastra un archivo JSON o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">Solo archivos .json</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-muted" />
            <span className="text-xs text-muted-foreground">o pega el JSON</span>
            <Separator className="flex-1 bg-muted" />
          </div>

          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value) }}
            placeholder='[{ "position": "...", "department": "...", "requiredCourses_1": "..." }]'
            rows={8}
            className="w-full rounded-xl border bg-muted text-foreground p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex gap-2 justify-end">
            {(jsonText || preview || importSuccess) && (
              <Button variant="outline" size="icon" onClick={handleReset} aria-label="Limpiar" title="Limpiar">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" onClick={handleParse} disabled={!jsonText.trim()} aria-label="Analizar JSON" title="Analizar JSON">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Vista previa de importación
            </CardTitle>
            <CardDescription>
              Revisa los datos antes de confirmar. Se usará upsert: no se duplicarán registros existentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Registros JSON", value: preview.totalRecords, Icon: FileJson },
                { label: "Departamentos",  value: preview.departments.length, Icon: Building2 },
                { label: "Puestos",        value: preview.positions.length,   Icon: Briefcase },
                { label: "Cursos únicos",  value: preview.courses.length,     Icon: BookOpen },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-lg border p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Departamentos detectados</p>
              <div className="flex flex-wrap gap-2">
                {preview.departments.map(d => (
                  <Badge key={d} variant="secondary" className="bg-muted text-foreground">{d}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Puestos (mostrando {Math.min(5, preview.positions.length)} de {preview.positions.length})
              </p>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/50">
                      <TableHead>Puesto</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead className="text-right">Cursos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.positions.slice(0, 5).map((pos, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-foreground text-sm">{pos.name}</TableCell>
                        <TableCell className="text-sm">{pos.department}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-foreground">{pos.courses.length}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="icon" onClick={handleImport} disabled={isReadOnly || importing} aria-label="Confirmar e importar" title="Confirmar e importar">
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
