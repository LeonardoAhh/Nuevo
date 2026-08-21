import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────

export type NoteColor = "default" | "red" | "yellow" | "green" | "blue" | "purple"
export type NoteType  = "text" | "checklist" | "attachment"

export interface ChecklistItem {
  text: string
  checked: boolean
}

export interface Note {
  id: string
  content: string
  type: NoteType
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
  checklist_items: ChecklistItem[]
  attachment_url: string | null
  attachment_name: string | null
  pinned: boolean
  color: NoteColor
}

export interface AddNotePayload {
  content: string
  type: NoteType
  created_by: string
  created_by_name: string
  checklist_items: ChecklistItem[]
  attachment_url?: string
  attachment_name?: string
  color: NoteColor
}

export interface UpdateNotePayload {
  content?: string
  checklist_items?: ChecklistItem[]
  attachment_url?: string
  attachment_name?: string
  color?: NoteColor
  pinned?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimeNotes() {
  const [notes, setNotes]     = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const pageRef               = useRef(0)

  const fetchNotes = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true)
      pageRef.current = 0
    }

    const from = pageRef.current * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("pinned",      { ascending: false })
      .order("created_at",  { ascending: false })
      .range(from, to)

    if (!error && data) {
      const parsed = data.map(parseNote)
      setNotes(prev => reset ? parsed : [...prev, ...parsed])
      setHasMore(data.length === PAGE_SIZE)
    }

    if (reset) setLoading(false)
  }, [])

  const loadMore = useCallback(async () => {
    pageRef.current += 1
    await fetchNotes(false)
  }, [fetchNotes])

  useEffect(() => {
    fetchNotes()
    // Polling cada 30s (Realtime no disponible en este proyecto)
    const interval = setInterval(() => fetchNotes(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchNotes])

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const addNote = useCallback(async (payload: AddNotePayload) => {
    const { error } = await supabase.from("notes").insert([payload])
    return { error }
  }, [])

  const updateNote = useCallback(async (id: string, updates: UpdateNotePayload) => {
    const { error } = await supabase.from("notes").update(updates).eq("id", id)
    if (!error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    }
    return { error }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id)
    return { error }
  }, [])

  const toggleChecklistItem = useCallback(async (noteId: string, index: number) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const updated = note.checklist_items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    )
    await updateNote(noteId, { checklist_items: updated })
  }, [notes, updateNote])

  const togglePin = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    await updateNote(noteId, { pinned: !note.pinned })
  }, [notes, updateNote])

  const uploadAttachment = useCallback(async (
    file: File,
    userId: string,
  ): Promise<{ url: string; name: string } | null> => {
    const ext  = file.name.split(".").pop() ?? "bin"
    // Prefijo con userId para que la política de delete funcione
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("notes-attachments")
      .upload(path, file)

    if (error) return null

    const { data: urlData } = supabase.storage
      .from("notes-attachments")
      .getPublicUrl(path)

    return { url: urlData.publicUrl, name: file.name }
  }, [])

  return {
    notes,
    loading,
    hasMore,
    addNote,
    updateNote,
    deleteNote,
    toggleChecklistItem,
    togglePin,
    loadMore,
    uploadAttachment,
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function parseNote(raw: Record<string, unknown>): Note {
  return {
    id:              raw.id              as string,
    content:        (raw.content        as string)    ?? "",
    type:           (raw.type           as NoteType)  ?? "text",
    created_by:     (raw.created_by     as string)    ?? null,
    created_by_name:(raw.created_by_name as string)   ?? null,
    created_at:      raw.created_at     as string,
    updated_at:     (raw.updated_at     as string)    ?? raw.created_at as string,
    checklist_items: Array.isArray(raw.checklist_items)
      ? (raw.checklist_items as ChecklistItem[])
      : [],
    attachment_url:  (raw.attachment_url  as string)  ?? null,
    attachment_name: (raw.attachment_name as string)  ?? null,
    pinned:          (raw.pinned          as boolean) ?? false,
    color:           (raw.color           as NoteColor) ?? "default",
  }
}
