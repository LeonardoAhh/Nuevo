"use client"

import { useState, useCallback } from "react"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ClipboardCheck,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRole } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { PreguntaExamen, PreguntaInsert } from "@/lib/hooks/useExamenes"
import { CATALOGO_ORGANIZACIONAL } from "@/lib/catalogo"

const DEPARTAMENTOS = Object.keys(CATALOGO_ORGANIZACIONAL)

interface ExamenesContentProps {
  preguntas: PreguntaExamen[]
  loading: boolean
  error: string | null
  onBuscar: (term: string) => void
  onCrear: (pregunta: PreguntaInsert) => Promise<PreguntaExamen>
  onActualizar: (id: string, cambios: Partial<PreguntaInsert>) => Promise<PreguntaExamen>
  onEliminar: (id: string) => Promise<void>
}

const RESPUESTA_LABELS: Record<string, string> = { a: "A", b: "B", c: "C" }
const PAGE_SIZE = 20

const EMPTY_FORM: PreguntaInsert = {
  departamento: "",
  pregunta: "",
  opcion_a: "",
  opcion_b: "",
  opcion_c: "",
  respuesta_correcta: "a",
}

export default function ExamenesContent({
  preguntas,
  loading,
  error,
  onBuscar,
  onCrear,
  onActualizar,
  onEliminar,
}: ExamenesContentProps) {
  const { isReadOnly } = useRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // Dialog crear/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PreguntaInsert>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Dialog confirmar eliminar
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Paginación
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(preguntas.length / PAGE_SIZE))
  const paginadas = preguntas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = useCallback(() => {
    setHasSearched(true)
    setPage(1)
    onBuscar(searchTerm)
  }, [searchTerm, onBuscar])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch()
    },
    [handleSearch]
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (p: PreguntaExamen) => {
    setEditingId(p.id)
    // Normalizar departamento a mayúsculas para que coincida con el catálogo
    const depUpper = p.departamento.toUpperCase()
    const depNorm = DEPARTAMENTOS.find((d) => d === depUpper) ?? p.departamento
    setForm({
      departamento: depNorm,
      pregunta: p.pregunta,
      opcion_a: p.opcion_a,
      opcion_b: p.opcion_b,
      opcion_c: p.opcion_c,
      respuesta_correcta: p.respuesta_correcta,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.departamento || !form.pregunta || !form.opcion_a || !form.opcion_b || !form.opcion_c) return
    setSaving(true)
    try {
      if (editingId) {
        await onActualizar(editingId, form)
      } else {
        await onCrear(form)
      }
      setDialogOpen(false)
      // Refrescar búsqueda actual
      if (hasSearched) onBuscar(searchTerm)
    } catch {
      // error se maneja en el hook
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await onEliminar(deleteId)
      setDeleteId(null)
    } catch {
      // error se maneja en el hook
    } finally {
      setDeleting(false)
    }
  }

  const updateField = (field: keyof PreguntaInsert, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="pt-2 pb-6 space-y-6">
      <ReadOnlyBanner />
      {/* Barra de búsqueda + botón crear */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pregunta, departamento u opción..."
            className={`pl-9 ${searchTerm ? "pr-9" : ""}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setHasSearched(false); onBuscar("") }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <Button variant="outline" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
          Buscar
        </Button>
        <Button onClick={openCreate} disabled={isReadOnly}>
          <Plus size={16} className="mr-2" />
          Nueva Pregunta
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Contenido: vacío hasta que se busque */}
      {!hasSearched ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardCheck size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Banco de Preguntas</p>
          <p className="text-sm mt-1">Usa la barra de búsqueda para encontrar preguntas o crea una nueva.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={20} className="mr-2 animate-spin" />
          Buscando preguntas...
        </div>
      ) : preguntas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Sin resultados</p>
          <p className="text-sm mt-1">No se encontraron preguntas para &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <>
          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationBar currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}

          {/* Vista móvil: tarjetas */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginadas.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="shrink-0 text-xs">{p.departamento}</Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="Editar" disabled={isReadOnly}>
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(p.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-snug mb-3">{p.pregunta}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Respuesta correcta:</span>
                    <Badge variant="outline" className="font-semibold">{RESPUESTA_LABELS[p.respuesta_correcta]}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vista desktop: tabla */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Departamento</TableHead>
                    <TableHead>Pregunta</TableHead>
                    <TableHead className="w-[100px] text-center">Respuesta</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginadas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Badge variant="secondary">{p.departamento}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="font-medium text-sm line-clamp-2">{p.pregunta}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{RESPUESTA_LABELS[p.respuesta_correcta]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar" disabled={isReadOnly}>
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(p.id)}
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog crear / editar */}
      <ResponsiveShell
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm:max-w-2xl"
        title={editingId ? "Editar Pregunta" : "Nueva Pregunta"}
        description={editingId ? "Modifica los campos y guarda los cambios." : "Llena los campos para agregar una nueva pregunta al banco."}
      >
        <ModalToolbar
          title={editingId ? "Editar Pregunta" : "Nueva Pregunta"}
          subtitle={form.departamento || "Sin departamento"}
          saving={saving}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleSave}
          confirmIcon={<Check size={16} />}
          confirmDisabled={isReadOnly || !form.departamento || !form.pregunta || !form.opcion_a || !form.opcion_b || !form.opcion_c}
        />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={form.departamento}
                onValueChange={(v) => updateField("departamento", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un departamento..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pregunta">Pregunta</Label>
              <Textarea
                id="pregunta"
                placeholder="Escribe la pregunta..."
                rows={3}
                value={form.pregunta}
                onChange={(e) => updateField("pregunta", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opcion_a">Opción A</Label>
              <Textarea
                id="opcion_a"
                rows={2}
                placeholder="Texto de la opción A"
                value={form.opcion_a}
                onChange={(e) => updateField("opcion_a", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opcion_b">Opción B</Label>
              <Textarea
                id="opcion_b"
                rows={2}
                placeholder="Texto de la opción B"
                value={form.opcion_b}
                onChange={(e) => updateField("opcion_b", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opcion_c">Opción C</Label>
              <Textarea
                id="opcion_c"
                rows={2}
                placeholder="Texto de la opción C"
                value={form.opcion_c}
                onChange={(e) => updateField("opcion_c", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Respuesta Correcta</Label>
              <Select
                value={form.respuesta_correcta}
                onValueChange={(v) => updateField("respuesta_correcta", v)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Opción A</SelectItem>
                  <SelectItem value="b">Opción B</SelectItem>
                  <SelectItem value="c">Opción C</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </ResponsiveShell>

      {/* Dialog confirmar eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pregunta será eliminada permanentemente del banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isReadOnly || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
