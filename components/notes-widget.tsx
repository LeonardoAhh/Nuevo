"use client"

import { useState, useMemo, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  Pin, PinOff, Pencil, Trash2, Paperclip,
  Plus, Search, X, Upload, FileText, ListChecks,
  Download, Eye, ImageIcon, FileIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

import { useUser }    from "@/lib/hooks/useUser"
import { useProfile } from "@/lib/hooks/useProfile"
import {
  useRealtimeNotes,
  type Note, type NoteColor, type NoteType, type ChecklistItem,
} from "@/lib/hooks/useRealtimeNotes"

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_CARD: Record<NoteColor, string> = {
  default: "border-border bg-card",
  red:     "border-red-200    bg-red-50    dark:border-red-800    dark:bg-red-950/20",
  yellow:  "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20",
  green:   "border-green-200  bg-green-50  dark:border-green-800  dark:bg-green-950/20",
  blue:    "border-blue-200   bg-blue-50   dark:border-blue-800   dark:bg-blue-950/20",
  purple:  "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20",
}

const COLOR_DOT: Record<NoteColor, string> = {
  default: "bg-muted-foreground/50",
  red:     "bg-red-500",
  yellow:  "bg-yellow-500",
  green:   "bg-green-500",
  blue:    "bg-blue-500",
  purple:  "bg-purple-500",
}

const NOTE_COLORS: NoteColor[] = ["default", "red", "yellow", "green", "blue", "purple"]

const TYPE_LABEL: Record<NoteType, string> = {
  text:       "Texto",
  checklist:  "Checklist",
  attachment: "Adjunto",
}

const TYPE_ICON: Record<NoteType, React.ReactNode> = {
  text:       <FileText   className="size-3.5" />,
  checklist:  <ListChecks className="size-3.5" />,
  attachment: <Paperclip  className="size-3.5" />,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
  } catch {
    return dateStr
  }
}

function rawToChecklist(raw: string): ChecklistItem[] {
  return raw
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
    .map(text => ({ text, checked: false }))
}

function mergeChecklist(raw: string, existing: ChecklistItem[]): ChecklistItem[] {
  return raw
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
    .map((text, i) => ({ text, checked: existing[i]?.checked ?? false }))
}

// ─── Form State ───────────────────────────────────────────────────────────────

interface NoteForm {
  type:           NoteType
  color:          NoteColor
  content:        string
  checklistRaw:   string
  attachmentUrl:  string
  attachmentName: string
}

const EMPTY_FORM: NoteForm = {
  type:           "text",
  color:          "default",
  content:        "",
  checklistRaw:   "",
  attachmentUrl:  "",
  attachmentName: "",
}

function isFormValid(form: NoteForm) {
  if (form.type === "text")       return form.content.trim().length > 0
  if (form.type === "checklist")  return form.checklistRaw.trim().length > 0
  if (form.type === "attachment") return form.attachmentUrl.length > 0
  return false
}

// ─── ColorPicker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value, onChange,
}: { value: NoteColor; onChange: (c: NoteColor) => void }) {
  return (
    <div className="flex items-center gap-2">
      {NOTE_COLORS.map(c => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          className={[
            "size-5 rounded-full transition-all shrink-0",
            COLOR_DOT[c],
            value === c
              ? "ring-2 ring-offset-2 ring-foreground/40 scale-110"
              : "hover:scale-105 opacity-70 hover:opacity-100",
          ].join(" ")}
        />
      ))}
    </div>
  )
}

// ─── Attachment preview ───────────────────────────────────────────────────────

type FileKind = "image" | "pdf" | "other"

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp"]

function getFileKind(url: string, name?: string | null): FileKind {
  const src = (name ?? url).toLowerCase()
  const ext = src.split(".").pop() ?? ""
  if (IMAGE_EXTS.includes(ext)) return "image"
  if (ext === "pdf") return "pdf"
  return "other"
}

interface PreviewTarget {
  url:  string
  name: string | null
}

function AttachmentPreviewDialog({
  target,
  onClose,
}: {
  target:  PreviewTarget | null
  onClose: () => void
}) {
  if (!target) return null
  const kind = getFileKind(target.url, target.name)
  const label = target.name ?? "Archivo adjunto"

  return (
    <Dialog open={!!target} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[95dvh] !px-0 !pt-0 overflow-hidden">
        <DialogHeader className="px-4 pt-2 pb-2 flex-row items-center justify-between gap-3 mb-0">
          <div className="flex items-center gap-2 min-w-0">
            {kind === "image" ? (
              <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : kind === "pdf" ? (
              <FileText className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <DialogTitle className="text-sm font-medium truncate">{label}</DialogTitle>
            <DialogDescription className="sr-only">Vista previa del archivo adjunto</DialogDescription>
          </div>
          <a
            href={target.url}
            download={label}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" />
              Descargar
            </Button>
          </a>
        </DialogHeader>

        <div className="px-2 pb-2">
          {kind === "image" && (
            <div className="flex items-center justify-center bg-muted/40 rounded-lg overflow-auto max-h-[80dvh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={target.url}
                alt={label}
                className="w-full object-contain"
              />
            </div>
          )}

          {kind === "pdf" && (
            <iframe
              src={target.url}
              title={label}
              className="w-full rounded-lg border"
              style={{ height: "72vh" }}
            />
          )}

          {kind === "other" && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-muted p-5">
                <FileIcon className="size-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Este tipo de archivo no tiene vista previa.
                </p>
              </div>
              <a href={target.url} download={label} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <Download className="size-4" />
                  Descargar archivo
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note:              Note
  isOwn:             boolean
  onToggleChecklist: (i: number) => void
  onPin:             () => void
  onEdit:            () => void
  onDelete:          () => void
  onPreview:         (target: PreviewTarget) => void
}

function NoteCard({ note, isOwn, onToggleChecklist, onPin, onEdit, onDelete, onPreview }: NoteCardProps) {
  const edited = note.updated_at && note.updated_at !== note.created_at

  return (
    <div
      className={[
        "group relative rounded-lg border p-3 transition-colors",
        COLOR_CARD[note.color],
      ].join(" ")}
    >
      {/* Pin badge */}
      {note.pinned && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 h-5 px-1.5 gap-1 text-[10px]"
        >
          <Pin className="size-2.5" /> Anclada
        </Badge>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {TYPE_ICON[note.type]}
          {TYPE_LABEL[note.type]}
        </span>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={onPin}>
                  {note.pinned
                    ? <PinOff className="size-3.5" />
                    : <Pin    className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{note.pinned ? "Desanclar" : "Anclar"}</TooltipContent>
            </Tooltip>

            {isOwn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
            )}

            {isOwn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      {note.type === "text" && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
      )}

      {note.type === "checklist" && (
        <ul className="space-y-1.5">
          {note.checklist_items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => onToggleChecklist(idx)}
                className="mt-0.5 shrink-0"
              />
              <span
                className={[
                  "text-sm leading-snug",
                  item.checked ? "line-through text-muted-foreground" : "",
                ].join(" ")}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {note.type === "attachment" && note.attachment_url && (() => {
        const kind  = getFileKind(note.attachment_url, note.attachment_name)
        const label = note.attachment_name ?? note.attachment_url
        return (
          <button
            type="button"
            onClick={() => onPreview({ url: note.attachment_url!, name: note.attachment_name })}
            className="w-full text-left group/att"
          >
            {kind === "image" ? (
              <div className="relative overflow-hidden rounded-md border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={note.attachment_url}
                  alt={label}
                  className="w-full object-contain transition-opacity group-hover/att:opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity bg-black/20 rounded-md">
                  <div className="bg-background/90 rounded-full p-2">
                    <Eye className="size-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1 px-0.5">{label}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                {kind === "pdf"
                  ? <FileText className="size-4 shrink-0" />
                  : <Paperclip className="size-4 shrink-0" />}
                <span className="truncate">{label}</span>
                <Eye className="size-3.5 shrink-0 opacity-60" />
              </div>
            )}
          </button>
        )
      })()}

      {/* Footer */}
      <div className="mt-2.5 flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium truncate max-w-[140px]">
          {note.created_by_name ?? "—"}
        </span>
        <span>·</span>
        <time
          dateTime={note.created_at}
          title={new Date(note.created_at).toLocaleString("es-MX")}
        >
          {relTime(note.created_at)}
        </time>
        {edited && <span className="italic">(editado)</span>}
      </div>
    </div>
  )
}

// ─── NoteFormDialog ───────────────────────────────────────────────────────────

interface NoteFormDialogProps {
  open:          boolean
  onOpenChange:  (v: boolean) => void
  title:         string
  submitLabel:   string
  form:          NoteForm
  onChange:      (patch: Partial<NoteForm>) => void
  onSubmit:      () => void
  submitting:    boolean
  onFileSelect:  (file: File) => void
  uploading:     boolean
}

function NoteFormDialog({
  open, onOpenChange, title, submitLabel,
  form, onChange, onSubmit, submitting, onFileSelect, uploading,
}: NoteFormDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para {title.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={e => { e.preventDefault(); onSubmit() }}
        >
          {/* Type + Color */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={form.type}
              onValueChange={v => onChange({ type: v as NoteType })}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="attachment">Adjunto</SelectItem>
              </SelectContent>
            </Select>

            <ColorPicker value={form.color} onChange={c => onChange({ color: c })} />
          </div>

          {/* Content area */}
          {form.type === "text" && (
            <Textarea
              placeholder="Escribe tu nota..."
              value={form.content}
              onChange={e => onChange({ content: e.target.value })}
              rows={4}
              className="resize-none"
              autoFocus
            />
          )}

          {form.type === "checklist" && (
            <div className="space-y-1">
              <Textarea
                placeholder={"Item 1\nItem 2\nItem 3..."}
                value={form.checklistRaw}
                onChange={e => onChange({ checklistRaw: e.target.value })}
                rows={5}
                className="resize-none font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Un ítem por línea.
              </p>
            </div>
          )}

          {form.type === "attachment" && (
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) onFileSelect(file)
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="size-4" />
                {uploading
                  ? "Subiendo..."
                  : form.attachmentName
                  ? form.attachmentName
                  : "Seleccionar archivo"}
              </Button>
              {form.attachmentName && !uploading && (
                <p className="text-xs text-center text-muted-foreground truncate px-2">
                  {form.attachmentName}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting || uploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploading || !isFormValid(form)}
            >
              {submitting ? "Guardando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

type FilterType = "all" | NoteType

export default function NotesWidget() {
  const { user }    = useUser()
  const { profile } = useProfile(user?.id)

  const {
    notes, loading, hasMore,
    addNote, updateNote, deleteNote,
    toggleChecklistItem, togglePin,
    loadMore, uploadAttachment,
  } = useRealtimeNotes()

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")

  // ── Attachment preview ──────────────────────────────────────────────────────
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null)

  // ── Add dialog ──────────────────────────────────────────────────────────────
  const [addOpen,      setAddOpen]      = useState(false)
  const [addForm,      setAddForm]      = useState<NoteForm>(EMPTY_FORM)
  const [addSubmitting,setAddSubmitting]= useState(false)
  const [addUploading, setAddUploading] = useState(false)

  // ── Edit dialog ─────────────────────────────────────────────────────────────
  const [editNote,      setEditNote]      = useState<Note | null>(null)
  const [editForm,      setEditForm]      = useState<NoteForm>(EMPTY_FORM)
  const [editSubmitting,setEditSubmitting]= useState(false)
  const [editUploading, setEditUploading] = useState(false)

  // ── Delete dialog ───────────────────────────────────────────────────────────
  const [deleteId,       setDeleteId]       = useState<string | null>(null)
  const [deleteSubmitting,setDeleteSubmitting] = useState(false)

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return notes.filter(n => {
      if (filterType !== "all" && n.type !== filterType) return false
      if (!q) return true
      return (
        n.content.toLowerCase().includes(q) ||
        (n.created_by_name ?? "").toLowerCase().includes(q) ||
        n.checklist_items.some(i => i.text.toLowerCase().includes(q))
      )
    })
  }, [notes, filterType, search])

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAdd() {
    if (!user) return
    setAddSubmitting(true)

    const payload = buildAddPayload(addForm, user.id, profile?.displayName ?? user.email ?? "")
    const { error } = await addNote(payload)

    setAddSubmitting(false)
    if (error) {
      toast.error("No se pudo agregar la nota")
    } else {
      setAddForm(EMPTY_FORM)
      setAddOpen(false)
      toast.success("Nota agregada")
    }
  }

  async function handleEdit() {
    if (!editNote) return
    setEditSubmitting(true)

    const updates = buildEditPayload(editForm, editNote.checklist_items)
    const { error } = await updateNote(editNote.id, updates)

    setEditSubmitting(false)
    if (error) {
      toast.error("No se pudo actualizar la nota")
    } else {
      setEditNote(null)
      toast.success("Nota actualizada")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteSubmitting(true)

    const { error } = await deleteNote(deleteId)

    setDeleteSubmitting(false)
    if (error) {
      toast.error("No se pudo eliminar la nota")
    } else {
      setDeleteId(null)
      toast.success("Nota eliminada")
    }
  }

  async function handleAddFile(file: File) {
    if (!user) return
    setAddUploading(true)
    const result = await uploadAttachment(file, user.id)
    setAddUploading(false)
    if (result) {
      setAddForm(f => ({ ...f, attachmentUrl: result.url, attachmentName: result.name }))
    } else {
      toast.error("Error al subir el archivo")
    }
  }

  async function handleEditFile(file: File) {
    if (!user) return
    setEditUploading(true)
    const result = await uploadAttachment(file, user.id)
    setEditUploading(false)
    if (result) {
      setEditForm(f => ({ ...f, attachmentUrl: result.url, attachmentName: result.name }))
    } else {
      toast.error("Error al subir el archivo")
    }
  }

  function openEdit(note: Note) {
    setEditNote(note)
    setEditForm({
      type:           note.type,
      color:          note.color,
      content:        note.type === "text" ? note.content : "",
      checklistRaw:   note.checklist_items.map(i => i.text).join("\n"),
      attachmentUrl:  note.attachment_url  ?? "",
      attachmentName: note.attachment_name ?? "",
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3">
          {/* Title + Add button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base font-semibold">
              Notas
            </CardTitle>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(true) }}
            >
              <Plus className="size-4" />
              Nueva nota
            </Button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar notas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {(["all", "text", "checklist", "attachment"] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={[
                  "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                  filterType === f
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                ].join(" ")}
              >
                {f === "all" ? "Todos" : TYPE_LABEL[f]}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            /* Skeleton */
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[76px] rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="py-10 text-center text-sm text-muted-foreground">
              {search || filterType !== "all"
                ? "Sin resultados. Prueba con otros filtros."
                : "Sin notas aún. ¡Agrega la primera!"}
            </div>
          ) : (
            /* Notes list */
            <div className="space-y-2">
              {filtered.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isOwn={note.created_by === user?.id}
                  onToggleChecklist={idx => toggleChecklistItem(note.id, idx)}
                  onPin={() => togglePin(note.id)}
                  onEdit={() => openEdit(note)}
                  onDelete={() => setDeleteId(note.id)}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-muted-foreground"
              onClick={loadMore}
            >
              Cargar más
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Add dialog ─────────────────────────────────────────────────────── */}
      <NoteFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Nueva nota"
        submitLabel="Agregar"
        form={addForm}
        onChange={patch => setAddForm(f => ({ ...f, ...patch }))}
        onSubmit={handleAdd}
        submitting={addSubmitting}
        onFileSelect={handleAddFile}
        uploading={addUploading}
      />

      {/* ── Edit dialog ─────────────────────────────────────────────────────── */}
      <NoteFormDialog
        open={!!editNote}
        onOpenChange={v => { if (!v) setEditNote(null) }}
        title="Editar nota"
        submitLabel="Guardar"
        form={editForm}
        onChange={patch => setEditForm(f => ({ ...f, ...patch }))}
        onSubmit={handleEdit}
        submitting={editSubmitting}
        onFileSelect={handleEditFile}
        uploading={editUploading}
      />

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={v => { if (!v) setDeleteId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubmitting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Attachment preview ───────────────────────────────────────────────── */}
      <AttachmentPreviewDialog
        target={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </>
  )
}

// ─── Payload builders ─────────────────────────────────────────────────────────

function buildAddPayload(form: NoteForm, userId: string, userName: string) {
  const base = {
    type:           form.type,
    color:          form.color,
    created_by:     userId,
    created_by_name: userName,
  }

  if (form.type === "text") {
    return { ...base, content: form.content, checklist_items: [] }
  }

  if (form.type === "checklist") {
    return { ...base, content: "", checklist_items: rawToChecklist(form.checklistRaw) }
  }

  // attachment
  return {
    ...base,
    content:        "",
    checklist_items: [],
    attachment_url:  form.attachmentUrl,
    attachment_name: form.attachmentName,
  }
}

function buildEditPayload(form: NoteForm, existingItems: ChecklistItem[]) {
  if (form.type === "text") {
    return { content: form.content, color: form.color }
  }

  if (form.type === "checklist") {
    return {
      color:           form.color,
      checklist_items: mergeChecklist(form.checklistRaw, existingItems),
    }
  }

  // attachment
  return {
    color:           form.color,
    attachment_url:  form.attachmentUrl  || undefined,
    attachment_name: form.attachmentName || undefined,
  }
}
