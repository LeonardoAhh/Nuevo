"use client"

import { useEffect, useRef, useState } from "react"
import { Save, X, ArrowLeft, Eye, FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { notify } from "@/lib/notify"
import { sanitizeCuerpoHtml } from "@/lib/formatos/sanitize"
import { FormatoSheet } from "./formato-sheet"
import { RichTextEditor } from "./rich-text-editor"
import type { Formato, FormatoDraft } from "@/lib/formatos/types"

interface Props {
  initial?: Formato
  saving?: boolean
  onSave: (draft: FormatoDraft) => Promise<void> | void
  onCancel: () => void
  canEdit: boolean
}

const EMPTY: FormatoDraft = {
  nombre_examen: "",
  codigo: "",
  revision: 1,
  cuerpo_html: "",
}

export function FormatoEditor({ initial, saving, onSave, onCancel, canEdit }: Props) {
  const [draft, setDraft] = useState<FormatoDraft>(() =>
    initial
      ? {
          id: initial.id,
          nombre_examen: initial.nombre_examen,
          codigo: initial.codigo,
          revision: initial.revision,
          cuerpo_html: initial.cuerpo_html,
        }
      : EMPTY,
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importDocx = async (file: File) => {
    setImporting(true)
    try {
      // Lazy-load mammoth — only the import button needs it, no point
      // shipping ~200KB to every user that just edits text.
      const mammoth = await import("mammoth/mammoth.browser")
      const buffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
      const sanitized = sanitizeCuerpoHtml(result.value)
      if (!sanitized.trim()) {
        notify.error("El archivo no contiene texto importable")
        return
      }
      set("cuerpo_html", sanitized)
      notify.success("Word importado. Edita el contenido y guarda.")
    } catch (e) {
      notify.error(
        e instanceof Error
          ? `No se pudo leer el archivo: ${e.message}`
          : "No se pudo leer el archivo .docx",
      )
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Re-sync when the user picks a different row to edit without unmounting.
  useEffect(() => {
    if (initial) {
      setDraft({
        id: initial.id,
        nombre_examen: initial.nombre_examen,
        codigo: initial.codigo,
        revision: initial.revision,
        cuerpo_html: initial.cuerpo_html,
      })
    } else {
      setDraft(EMPTY)
    }
  }, [initial])

  const set = <K extends keyof FormatoDraft>(k: K, v: FormatoDraft[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    await onSave(draft)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5">
          <ArrowLeft size={14} />
          Volver al listado
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
            className="gap-1.5 lg:hidden"
            aria-pressed={previewOpen}
          >
            <Eye size={14} />
            {previewOpen ? "Ocultar vista" : "Ver vista previa"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-1.5"
            disabled={saving}
          >
            <X size={14} /> Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !canEdit} className="gap-1.5">
            <Save size={14} />
            {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear formato"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        {/* ─── Form column ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="fmt-nombre">Nombre del examen</Label>
              <Input
                id="fmt-nombre"
                value={draft.nombre_examen}
                onChange={(e) => set("nombre_examen", e.target.value)}
                placeholder="Ej. Metodología 5'S"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fmt-codigo">Código</Label>
              <Input
                id="fmt-codigo"
                value={draft.codigo}
                onChange={(e) => set("codigo", e.target.value)}
                placeholder="Ej. RG-ADM-049"
                disabled={!canEdit}
              />
              <p className="text-xs text-muted-foreground">
                Aparece en la esquina inferior izquierda de la hoja.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fmt-revision">Revisión</Label>
              <Input
                id="fmt-revision"
                type="number"
                min={0}
                max={999}
                value={draft.revision}
                onChange={(e) => set("revision", Number(e.target.value) || 0)}
                disabled={!canEdit}
              />
              <p className="text-xs text-muted-foreground">
                Se imprime como <code>Rev. {draft.revision}</code> a la derecha del pie.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Cuerpo del examen</Label>
              {canEdit && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={importing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {importing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FileUp size={14} />
                    )}
                    {importing ? "Importando…" : "Importar Word (.docx)"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) importDocx(f)
                    }}
                  />
                </>
              )}
            </div>
            <RichTextEditor
              value={draft.cuerpo_html}
              onChange={(html) => set("cuerpo_html", html)}
            />
            <p className="text-xs text-muted-foreground">
              El encabezado con logo, título y campos (Nombre, No. Empleado, Turno, Departamento,
              Fecha, Calificación) se agrega automáticamente al imprimir. Si importas un Word que
              ya los incluye, bórralos del editor para evitar duplicado.
            </p>
          </div>
        </div>

        {/* ─── Preview column ──────────────────────────────────────────────── */}
        <aside
          className={
            previewOpen
              ? "block lg:block"
              : "hidden lg:block"
          }
          aria-label="Vista previa de la hoja"
        >
          <div className="sticky top-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Vista previa (carta)</p>
            <div className="overflow-auto rounded-md border border-border/60 bg-muted/40 p-3">
              <FormatoSheet
                nombre_examen={draft.nombre_examen}
                codigo={draft.codigo}
                revision={draft.revision}
                cuerpo_html={draft.cuerpo_html}
                scale={0.55}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
