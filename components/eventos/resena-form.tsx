"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { StarRating } from "./star-rating"

const MIN_TIME_SECS = 3

interface Props {
  onSubmit: (input: { nombre: string; rating: number; comentario?: string }) => Promise<void>
}

export function ResenaForm({ onSubmit }: Props) {
  const [nombre, setNombre] = useState("")
  const [rating, setRating] = useState(0)
  const [comentario, setComentario] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secsLeft, setSecsLeft] = useState(MIN_TIME_SECS)
  const mountedAt = useRef<number>(Date.now())

  useEffect(() => {
    mountedAt.current = Date.now()
    const tick = () => {
      const elapsed = (Date.now() - mountedAt.current) / 1000
      setSecsLeft(Math.max(0, MIN_TIME_SECS - elapsed))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [])

  const submitDisabled = submitting || secsLeft > 0 || nombre.trim().length < 2 || rating < 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (submitDisabled) return

    if (honeypot.length > 0) {
      setNombre("")
      setComentario("")
      setRating(0)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        nombre: nombre.trim(),
        rating,
        comentario: comentario.trim() || undefined,
      })
      setNombre("")
      setComentario("")
      setRating(0)
      mountedAt.current = Date.now()
      setSecsLeft(MIN_TIME_SECS)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al publicar reseña")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Deja tu reseña</h3>
        <p className="text-xs text-muted-foreground">Tu nombre y reseña serán visibles para otros.</p>
      </div>

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="space-y-1.5">
        <Label htmlFor="resena-nombre">Tu nombre</Label>
        <Input
          id="resena-nombre"
          placeholder="Ej. Juan Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          minLength={2}
          maxLength={60}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Calificación</p>
        <StarRating
          value={rating}
          onChange={setRating}
          size={24}
          ariaLabel="Calificación del evento"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resena-comentario">Comentario (opcional)</Label>
        <Textarea
          id="resena-comentario"
          rows={3}
          placeholder="Cuéntanos qué te pareció el evento"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={2000}
        />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitDisabled} className="min-h-10">
          {submitting && <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />}
          Publicar reseña
        </Button>
      </div>
    </form>
  )
}
