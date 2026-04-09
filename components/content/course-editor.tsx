"use client"

import {
  ArrowLeft, Check, ChevronDown, ChevronUp, GripVertical,
  Loader2, Plus, Save, Trash2, X,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCurso, useSlides, type Slide } from "@/lib/hooks"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ── Tipos ─────────────────────────────────────────────────────────────────────

const SLIDE_TYPES = [
  { value: "title",   label: "Portada" },
  { value: "content", label: "Contenido" },
  { value: "bullets", label: "Lista" },
  { value: "image",   label: "Imagen" },
  { value: "video",   label: "Video" },
  { value: "quote",   label: "Cita" },
]

type SlideData = Record<string, unknown>

function defaultData(type: string): SlideData {
  switch (type) {
    case "title":   return { title: "", subtitle: "" }
    case "content": return { title: "", body: "" }
    case "bullets": return { title: "", items: [""] }
    case "image":   return { title: "", url: "", caption: "" }
    case "video":   return { title: "", videoUrl: "" }
    case "quote":   return { text: "", author: "" }
    default:        return { title: "", body: "" }
  }
}

// ── Slide data fields ─────────────────────────────────────────────────────────

function SlideDataEditor({
  type, data, onChange,
}: {
  type: string
  data: SlideData
  onChange: (d: SlideData) => void
}) {
  const set = (key: string, val: unknown) => onChange({ ...data, [key]: val })

  switch (type) {
    case "title":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={(data.title as string) ?? ""} onChange={e => set("title", e.target.value)} placeholder="Título de la portada" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtítulo</Label>
            <Input value={(data.subtitle as string) ?? ""} onChange={e => set("subtitle", e.target.value)} placeholder="Subtítulo opcional" />
          </div>
        </div>
      )

    case "content":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={(data.title as string) ?? ""} onChange={e => set("title", e.target.value)} placeholder="Título del slide" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cuerpo</Label>
            <Textarea
              rows={5}
              value={(data.body as string) ?? ""}
              onChange={e => set("body", e.target.value)}
              placeholder="Escribe el contenido del slide..."
              className="text-sm resize-none"
            />
          </div>
        </div>
      )

    case "bullets": {
      const items = (data.items as string[]) ?? [""]
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={(data.title as string) ?? ""} onChange={e => set("title", e.target.value)} placeholder="Título de la lista" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Puntos</Label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={e => {
                      const next = [...items]
                      next[i] = e.target.value
                      set("items", next)
                    }}
                    placeholder={`Punto ${i + 1}`}
                    className="text-sm"
                  />
                  <Button
                    variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0 text-gray-400 hover:text-red-500"
                    onClick={() => set("items", items.filter((_, j) => j !== i))}
                    disabled={items.length <= 1}
                  >
                    <X size={13} />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => set("items", [...items, ""])}>
                <Plus size={12} /> Agregar punto
              </Button>
            </div>
          </div>
        </div>
      )
    }

    case "image":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={(data.title as string) ?? ""} onChange={e => set("title", e.target.value)} placeholder="Título opcional" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL de imagen</Label>
            <Input value={(data.url as string) ?? ""} onChange={e => set("url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pie de foto</Label>
            <Input value={(data.caption as string) ?? ""} onChange={e => set("caption", e.target.value)} placeholder="Descripción de la imagen" />
          </div>
        </div>
      )

    case "video":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={(data.title as string) ?? ""} onChange={e => set("title", e.target.value)} placeholder="Título del video" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL del video (YouTube embed, Vimeo...)</Label>
            <Input value={(data.videoUrl as string) ?? ""} onChange={e => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/embed/..." />
          </div>
        </div>
      )

    case "quote":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Cita</Label>
            <Textarea
              rows={3}
              value={(data.text as string) ?? ""}
              onChange={e => set("text", e.target.value)}
              placeholder="Escribe la cita..."
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Autor</Label>
            <Input value={(data.author as string) ?? ""} onChange={e => set("author", e.target.value)} placeholder="Nombre del autor" />
          </div>
        </div>
      )

    default:
      return null
  }
}

// ── Slide item en la lista lateral ────────────────────────────────────────────

function SlideListItem({
  slide, index, active, total, onSelect, onMoveUp, onMoveDown, onDelete,
}: {
  slide: Slide & { _dirty?: boolean }
  index: number
  active: boolean
  total: number
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const d = slide.data ?? {}
  const label = (d.title ?? d.text ?? `Slide ${index + 1}`) as string
  const typeLabel = SLIDE_TYPES.find(t => t.value === slide.type)?.label ?? slide.type

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer",
        active ? "bg-primary/10" : "hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      onClick={onSelect}
    >
      <GripVertical size={12} className="text-gray-300 dark:text-gray-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs truncate", active ? "text-primary font-medium" : "text-gray-700 dark:text-gray-300")}>
          <span className="text-[10px] text-gray-400 mr-1">{index + 1}.</span>
          {label || `(sin título)`}
        </p>
        <p className="text-[10px] text-gray-400">{typeLabel}</p>
      </div>
      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={index === 0}>
          <ChevronUp size={10} />
        </Button>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1}>
          <ChevronDown size={10} />
        </Button>
      </div>
      <Button
        variant="ghost" size="sm"
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        onClick={e => { e.stopPropagation(); onDelete() }}
      >
        <Trash2 size={10} />
      </Button>
    </div>
  )
}

// ── Editor principal ──────────────────────────────────────────────────────────

type EditableSlide = Slide & { _new?: boolean; _deleted?: boolean }

export default function CourseEditor({ id }: { id: string }) {
  const router = useRouter()
  const { curso, loading: loadingCurso, refetch: refetchCurso } = useCurso(id)
  const { slides: rawSlides, loading: loadingSlides, refetch: refetchSlides } = useSlides(id)

  // Metadata local
  const [title, setTitle]       = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [duration, setDuration] = useState("")
  const [instructor, setInstructor] = useState("")
  const [instructorRole, setInstructorRole] = useState("")
  const [tipo, setTipo]         = useState("")
  const [published, setPublished] = useState(false)

  // Slides locales (con posibles cambios no guardados)
  const [slides, setSlides] = useState<EditableSlide[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Sync cuando carga el curso
  useEffect(() => {
    if (curso) {
      setTitle(curso.title ?? "")
      setDescription(curso.description ?? "")
      setCategory(curso.category ?? "")
      setDuration(curso.duration ?? "")
      setInstructor(curso.instructor ?? "")
      setInstructorRole(curso.instructor_role ?? "")
      setTipo(curso.tipo ?? "")
      setPublished(curso.published ?? false)
    }
  }, [curso])

  useEffect(() => {
    if (rawSlides.length > 0) {
      setSlides(rawSlides)
    }
  }, [rawSlides])

  // ── Slide helpers ───────────────────────────────────────────────────────────

  const addSlide = useCallback(() => {
    const newSlide: EditableSlide = {
      id: `_new_${Date.now()}`,
      curso_id: id,
      order: slides.length,
      type: "content",
      data: defaultData("content"),
      _new: true,
    }
    setSlides(prev => [...prev, newSlide])
    setActiveSlide(slides.length)
  }, [id, slides.length])

  const deleteSlide = useCallback((index: number) => {
    setSlides(prev => prev.filter((_, i) => i !== index))
    setActiveSlide(i => Math.min(i, Math.max(0, index - 1)))
  }, [])

  const moveSlide = useCallback((from: number, to: number) => {
    if (to < 0 || to >= slides.length) return
    setSlides(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setActiveSlide(to)
  }, [slides.length])

  const updateActiveType = useCallback((newType: string) => {
    setSlides(prev => prev.map((s, i) =>
      i === activeSlide ? { ...s, type: newType, data: defaultData(newType) } : s
    ))
  }, [activeSlide])

  const updateActiveData = useCallback((newData: SlideData) => {
    setSlides(prev => prev.map((s, i) =>
      i === activeSlide ? { ...s, data: newData } : s
    ))
  }, [activeSlide])

  // ── Guardar ─────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true)
    setSaveMsg(null)

    // 1. Actualizar metadata del curso
    const { error: cursoError } = await supabase
      .from("cursos")
      .update({
        title,
        description: description || null,
        category: category || null,
        duration: duration || null,
        instructor: instructor || null,
        instructor_role: instructorRole || null,
        tipo: tipo || null,
        published,
        slide_count: slides.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (cursoError) {
      setSaveMsg(`Error al guardar: ${cursoError.message}`)
      setSaving(false)
      return
    }

    // 2. Upsert slides en batch (re-assign order)
    const slidesToUpsert = slides.map((s, i) => ({
      id: s._new ? `${id}_slide_${Date.now()}_${i}` : s.id,
      curso_id: id,
      order: i,
      type: s.type,
      data: s.data,
    }))

    if (slidesToUpsert.length > 0) {
      const { error: slidesError } = await supabase
        .from("slides")
        .upsert(slidesToUpsert, { onConflict: "id" })
      if (slidesError) {
        setSaveMsg(`Error en slides: ${slidesError.message}`)
        setSaving(false)
        return
      }
    }

    // 3. Eliminar slides que ya no existen
    const existingIds = rawSlides.map(s => s.id)
    const currentIds  = slidesToUpsert.map(s => s.id)
    const toDelete    = existingIds.filter(eid => !currentIds.includes(eid))
    if (toDelete.length > 0) {
      await supabase.from("slides").delete().in("id", toDelete)
    }

    await Promise.all([refetchCurso(), refetchSlides()])
    setSaveMsg("Guardado")
    setTimeout(() => setSaveMsg(null), 3000)
    setSaving(false)
  }, [
    id, title, description, category, duration, instructor,
    instructorRole, tipo, published, slides, rawSlides, refetchCurso, refetchSlides,
  ])

  const loading = loadingCurso || loadingSlides
  const currentSlide = slides[activeSlide]

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[600px]">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-sm">
            {loading ? "Cargando..." : (title || "Sin título")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className={cn("text-xs flex items-center gap-1", saveMsg === "Guardado" ? "text-green-600" : "text-red-500")}>
              {saveMsg === "Guardado" && <Check size={12} />}
              {saveMsg}
            </span>
          )}
          <Button size="sm" onClick={save} disabled={saving || loading} className="gap-1.5 h-8">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Guardar
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Panel izquierdo: lista de slides ── */}
        <aside className="w-52 shrink-0 border-r dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-950 overflow-y-auto">
          <div className="p-2 space-y-0.5 flex-1">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                ))
              : slides.map((s, i) => (
                  <SlideListItem
                    key={s.id}
                    slide={s}
                    index={i}
                    active={i === activeSlide}
                    total={slides.length}
                    onSelect={() => setActiveSlide(i)}
                    onMoveUp={() => moveSlide(i, i - 1)}
                    onMoveDown={() => moveSlide(i, i + 1)}
                    onDelete={() => deleteSlide(i)}
                  />
                ))
            }
          </div>
          <div className="p-2 border-t dark:border-gray-800">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addSlide}>
              <Plus size={12} /> Nuevo slide
            </Button>
          </div>
        </aside>

        {/* ── Panel central / derecho: editor ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!loading && slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <p className="text-sm">No hay slides. Agrega uno desde el panel izquierdo.</p>
            </div>
          ) : currentSlide != null ? (
            <>
              {/* Editor del slide activo */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Slide {activeSlide + 1} de {slides.length}</CardTitle>
                    <div className="w-36">
                      <Select value={currentSlide.type} onValueChange={updateActiveType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SLIDE_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <SlideDataEditor
                    type={currentSlide.type}
                    data={currentSlide.data as SlideData}
                    onChange={updateActiveData}
                  />
                </CardContent>
              </Card>

              <Separator />
            </>
          ) : null}

          {/* Metadata del curso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Información del curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Título</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre del curso" disabled={loading} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Descripción</Label>
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descripción breve del curso"
                    disabled={loading}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoría</Label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="ej. Seguridad" disabled={loading} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duración</Label>
                  <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="ej. 30 min" disabled={loading} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Input value={tipo} onChange={e => setTipo(e.target.value)} placeholder="ej. Inducción" disabled={loading} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instructor</Label>
                  <Input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Nombre del instructor" disabled={loading} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rol del instructor</Label>
                  <Input value={instructorRole} onChange={e => setInstructorRole(e.target.value)} placeholder="ej. Jefe de área" disabled={loading} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Switch id="published" checked={published} onCheckedChange={setPublished} disabled={loading} />
                <Label htmlFor="published" className="text-xs cursor-pointer">
                  Publicado
                  {published
                    ? <Badge variant="secondary" className="ml-2 text-[10px] py-0">visible</Badge>
                    : <Badge variant="outline" className="ml-2 text-[10px] py-0">borrador</Badge>
                  }
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
