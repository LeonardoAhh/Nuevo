"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

export interface Evento {
  id: string
  titulo: string
  descripcion: string | null
  fecha: string | null
  publicado: boolean
  cover_path: string | null
  created_at: string
  updated_at: string
}

export interface EventoFoto {
  id: string
  evento_id: string
  storage_path: string
  caption: string | null
  order_index: number
  created_at: string
}

export interface EventoResena {
  id: string
  evento_id: string
  nombre: string
  rating: number
  comentario: string | null
  created_at: string
}

export interface EventoWithAggregates extends Evento {
  fotos: EventoFoto[]
  rating_avg: number | null
  rating_count: number
}

const BUCKET = "eventos"

/** Construye la URL pública de un storage_path del bucket eventos. */
export function eventoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? null
}

export function isVideoPath(path: string | null | undefined): boolean {
  if (!path) return false
  const ext = path.split(".").pop()?.toLowerCase()
  return ["mp4", "webm", "mov", "ogg", "quicktime"].includes(ext || "")
}

/** Hook para la vista pública del mural: carga eventos publicados con fotos + agregados de reseñas. */
export function useEventosPublicos() {
  const [eventos, setEventos] = useState<EventoWithAggregates[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: evData, error: evErr } = await supabase
        .from("eventos")
        .select("*")
        .eq("publicado", true)
        .order("fecha", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
      if (evErr) throw evErr

      const evs = (evData as Evento[]) ?? []
      if (evs.length === 0) {
        setEventos([])
        return
      }

      const ids = evs.map((e) => e.id)
      const [
        { data: fotos, error: fotosErr },
        { data: resenas, error: resenasErr },
      ] = await Promise.all([
        supabase
          .from("evento_fotos")
          .select("*")
          .in("evento_id", ids)
          .order("order_index", { ascending: true }),
        supabase
          .from("evento_resenas")
          .select("evento_id, rating")
          .in("evento_id", ids),
      ])
      if (fotosErr) throw fotosErr
      if (resenasErr) throw resenasErr

      const fotosByEvento = new Map<string, EventoFoto[]>()
      for (const f of (fotos as EventoFoto[] | null) ?? []) {
        const arr = fotosByEvento.get(f.evento_id) ?? []
        arr.push(f)
        fotosByEvento.set(f.evento_id, arr)
      }

      const ratingAgg = new Map<string, { sum: number; count: number }>()
      for (const r of (resenas as { evento_id: string; rating: number }[] | null) ?? []) {
        const cur = ratingAgg.get(r.evento_id) ?? { sum: 0, count: 0 }
        cur.sum += r.rating
        cur.count += 1
        ratingAgg.set(r.evento_id, cur)
      }

      setEventos(
        evs.map((e) => {
          const agg = ratingAgg.get(e.id)
          return {
            ...e,
            fotos: fotosByEvento.get(e.id) ?? [],
            rating_avg: agg ? agg.sum / agg.count : null,
            rating_count: agg?.count ?? 0,
          }
        }),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar eventos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { eventos, loading, error, recargar: cargar }
}

/** Hook para las reseñas de un evento específico. */
export function useEventoResenas(eventoId: string | null) {
  const [resenas, setResenas] = useState<EventoResena[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Counter incremented on each load; stale responses (from a previous
  // eventoId) are discarded by comparing against the latest value.
  const requestIdRef = useRef(0)

  const cargar = useCallback(async () => {
    if (!eventoId) return
    const reqId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("evento_resenas")
        .select("*")
        .eq("evento_id", eventoId)
        .order("created_at", { ascending: false })
      if (reqId !== requestIdRef.current) return // stale response
      if (err) throw err
      setResenas((data as EventoResena[]) ?? [])
    } catch (err: unknown) {
      if (reqId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : "Error al cargar reseñas")
    } finally {
      if (reqId === requestIdRef.current) setLoading(false)
    }
  }, [eventoId])

  useEffect(() => {
    // Reset state immediately on eventoId change / close so we never show
    // stale reviews from a previously viewed event.
    requestIdRef.current += 1
    setResenas([])
    setError(null)
    if (!eventoId) {
      setLoading(false)
      return
    }
    cargar()
  }, [eventoId, cargar])

  const publicar = useCallback(
    async (input: { nombre: string; rating: number; comentario?: string }) => {
      if (!eventoId) throw new Error("Evento no disponible")
      const nombre = input.nombre.trim()
      const comentario = input.comentario?.trim() || null
      if (nombre.length < 2 || nombre.length > 60) {
        throw new Error("El nombre debe tener entre 2 y 60 caracteres")
      }
      if (input.rating < 1 || input.rating > 5) {
        throw new Error("Selecciona una calificación de 1 a 5 estrellas")
      }
      if (comentario && comentario.length > 2000) {
        throw new Error("El comentario es demasiado largo")
      }

      const { data, error: err } = await supabase
        .from("evento_resenas")
        .insert({
          evento_id: eventoId,
          nombre,
          rating: input.rating,
          comentario,
        })
        .select()
        .single()

      if (err) {
        notify.error("Error al publicar reseña")
        throw new Error(err.message)
      }

      setResenas((prev) => [data as EventoResena, ...prev])
      notify.success("Reseña publicada")
    },
    [eventoId],
  )

  return { resenas, loading, error, recargar: cargar, publicar }
}

/** Hook administrativo para crear eventos y subir fotos (solo dev). */
export function useEventosAdmin(onChange?: () => void) {
  const [saving, setSaving] = useState(false)

  const crearEvento = useCallback(
    async (input: { titulo: string; descripcion?: string | null; fecha?: string | null }) => {
      setSaving(true)
      try {
        const { data, error: err } = await supabase
          .from("eventos")
          .insert({
            titulo: input.titulo.trim(),
            descripcion: input.descripcion?.trim() || null,
            fecha: input.fecha || null,
            publicado: true,
          })
          .select()
          .single()
        if (err) {
          notify.error("Error al crear evento")
          throw new Error(err.message)
        }
        notify.success("Evento creado")
        onChange?.()
        return data as Evento
      } finally {
        setSaving(false)
      }
    },
    [onChange],
  )

  const subirFotos = useCallback(
    async (eventoId: string, files: File[], opts?: { asCover?: boolean }) => {
      if (files.length === 0) return
      setSaving(true)
      try {
        // Continue the order_index sequence from whatever already exists so
        // subsequent upload batches don't clash with earlier ones.
        const { data: maxRow } = await supabase
          .from("evento_fotos")
          .select("order_index")
          .eq("evento_id", eventoId)
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle()
        const startIndex = (maxRow?.order_index ?? -1) + 1

        const timestamp = Date.now()
        const uploaded: EventoFoto[] = []
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
          const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg"
          const path = `${eventoId}/${timestamp}-${i}.${safeExt}`
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type })
          if (upErr) {
            notify.error(`Error al subir ${file.name}`)
            throw new Error(upErr.message)
          }

          const { data: row, error: dbErr } = await supabase
            .from("evento_fotos")
            .insert({
              evento_id: eventoId,
              storage_path: path,
              order_index: startIndex + i,
            })
            .select()
            .single()
          if (dbErr) {
            notify.error("Error al registrar foto")
            throw new Error(dbErr.message)
          }
          uploaded.push(row as EventoFoto)
        }

        if (opts?.asCover && uploaded.length > 0) {
          await supabase
            .from("eventos")
            .update({ cover_path: uploaded[0].storage_path })
            .eq("id", eventoId)
        }

        notify.success(`${files.length} foto${files.length !== 1 ? "s" : ""} subida${files.length !== 1 ? "s" : ""}`)
        onChange?.()
        return uploaded
      } finally {
        setSaving(false)
      }
    },
    [onChange],
  )

  const eliminarEvento = useCallback(
    async (eventoId: string) => {
      setSaving(true)
      try {
        // Borrar fotos del storage primero para no dejar basura.
        const { data: fotos } = await supabase
          .from("evento_fotos")
          .select("storage_path")
          .eq("evento_id", eventoId)
        const paths = ((fotos as { storage_path: string }[] | null) ?? []).map((f) => f.storage_path)
        if (paths.length > 0) {
          await supabase.storage.from(BUCKET).remove(paths)
        }
        const { error: err } = await supabase.from("eventos").delete().eq("id", eventoId)
        if (err) {
          notify.error("Error al eliminar evento")
          throw new Error(err.message)
        }
        notify.success("Evento eliminado")
        onChange?.()
      } finally {
        setSaving(false)
      }
    },
    [onChange],
  )

  const eliminarFoto = useCallback(
    async (fotoId: string, storagePath: string) => {
      setSaving(true)
      try {
        await supabase.storage.from(BUCKET).remove([storagePath])
        const { error: err } = await supabase.from("evento_fotos").delete().eq("id", fotoId)
        if (err) {
          notify.error("Error al eliminar foto")
          throw new Error(err.message)
        }
        notify.success("Foto eliminada")
        onChange?.()
      } finally {
        setSaving(false)
      }
    },
    [onChange],
  )

  return { saving, crearEvento, subirFotos, eliminarEvento, eliminarFoto }
}
