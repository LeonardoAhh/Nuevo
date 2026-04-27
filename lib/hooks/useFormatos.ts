"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { sanitizeCuerpoHtml } from "@/lib/formatos/sanitize"
import {
  validateFormato,
  type Formato,
  type FormatoDraft,
} from "@/lib/formatos/types"

/**
 * CRUD hook for `/formatos`. Mutations rely on RLS — non-dev users get
 * a Postgres permission error, surfaced as a friendly toast.
 */
export function useFormatos() {
  const [items, setItems] = useState<Formato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reqIdRef = useRef(0)

  const reload = useCallback(async () => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("formatos")
        .select("*")
        .order("activo", { ascending: false })
        .order("updated_at", { ascending: false })
      if (err) throw err
      if (reqId !== reqIdRef.current) return
      setItems(data ?? [])
    } catch (e) {
      if (reqId !== reqIdRef.current) return
      const msg = e instanceof Error ? e.message : "Error al cargar formatos"
      setError(msg)
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(
    async (draft: FormatoDraft): Promise<Formato | null> => {
      const validationError = validateFormato(draft)
      if (validationError) {
        notify.error(validationError)
        return null
      }

      const payload = {
        nombre_examen: draft.nombre_examen.trim(),
        codigo: draft.codigo.trim(),
        revision: draft.revision,
        cuerpo_html: sanitizeCuerpoHtml(draft.cuerpo_html),
      }

      try {
        if (draft.id) {
          const { data, error: err } = await supabase
            .from("formatos")
            .update(payload)
            .eq("id", draft.id)
            .select()
            .single()
          if (err) throw err
          notify.success("Formato actualizado")
          await reload()
          return data
        }
        const { data, error: err } = await supabase
          .from("formatos")
          .insert(payload)
          .select()
          .single()
        if (err) throw err
        notify.success("Formato creado")
        await reload()
        return data
      } catch (e) {
        notify.error(friendlyMessage(e))
        return null
      }
    },
    [reload],
  )

  const setActivo = useCallback(
    async (id: string, activo: boolean) => {
      try {
        const { error: err } = await supabase
          .from("formatos")
          .update({ activo })
          .eq("id", id)
        if (err) throw err
        notify.success(activo ? "Formato restaurado" : "Formato archivado")
        await reload()
      } catch (e) {
        notify.error(friendlyMessage(e))
      }
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase
          .from("formatos")
          .delete()
          .eq("id", id)
        if (err) throw err
        notify.success("Formato eliminado")
        await reload()
      } catch (e) {
        notify.error(friendlyMessage(e))
      }
    },
    [reload],
  )

  const duplicate = useCallback(
    async (id: string) => {
      const original = items.find((f) => f.id === id)
      if (!original) return null
      const draft: FormatoDraft = {
        nombre_examen: `${original.nombre_examen} (copia)`,
        codigo: `${original.codigo}-COPIA`,
        revision: 1,
        cuerpo_html: original.cuerpo_html,
      }
      return save(draft)
    },
    [items, save],
  )

  return { items, loading, error, reload, save, setActivo, remove, duplicate }
}

/** Translate Postgres / Supabase errors into Spanish human strings. */
function friendlyMessage(e: unknown): string {
  if (!(e instanceof Error)) return "Error desconocido"
  const msg = e.message.toLowerCase()
  if (msg.includes("permission denied") || msg.includes("insufficient_privilege")) {
    return "No tienes permisos para realizar esta acción"
  }
  if (msg.includes("formatos_codigo_activo_uniq")) {
    return "Ya existe un formato activo con ese código. Archiva el anterior primero."
  }
  if (msg.includes("formatos_codigo_chk")) return "El código debe tener entre 2 y 50 caracteres"
  if (msg.includes("formatos_nombre_chk")) return "El nombre debe tener entre 2 y 200 caracteres"
  if (msg.includes("formatos_revision_chk")) return "La revisión debe estar entre 0 y 999"
  if (msg.includes("formatos_cuerpo_chk")) return "El cuerpo del formato es demasiado largo"
  return e.message
}
