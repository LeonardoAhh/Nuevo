"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { supabase } from "@/lib/supabase/client"
import { FormatoSheet } from "./formato-sheet"
import type { Formato } from "@/lib/formatos/types"

interface Props {
  id: string
}

/**
 * Print-friendly view of a single formato. Loads the row, shows the
 * scaled sheet on screen with a Print button, and switches to a 1:1
 * paper-only render when the user triggers `window.print()`.
 *
 * The toolbar (back / print buttons) is hidden via `@media print`,
 * declared in globals.css so we don't need a dedicated stylesheet here.
 */
export function FormatoPrintClient({ id }: Props) {
  const [formato, setFormato] = useState<Formato | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data, error: err } = await supabase
          .from("formatos")
          .select("*")
          .eq("id", id)
          .maybeSingle()
        if (err) throw err
        if (cancelled) return
        if (!data) {
          setError("No encontramos este formato")
        } else {
          setFormato(data as Formato)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !formato) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <ErrorState
          title="No se pudo abrir el formato"
          description={error ?? "Verifica el enlace o que el formato siga existiendo."}
        />
        <div className="mt-4 flex justify-center">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/formatos">
              <ArrowLeft size={14} /> Volver al listado
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="formato-print-host min-h-screen bg-muted/40 py-8 px-4 sm:px-8">
      {/* Toolbar — hidden during print via @media print rules. */}
      <div className="formato-print-toolbar mx-auto mb-4 flex max-w-[8.5in] items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/formatos">
            <ArrowLeft size={14} /> Volver
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer size={14} /> Imprimir
        </Button>
      </div>

      <div className="mx-auto flex max-w-full justify-center overflow-auto">
        <FormatoSheet
          nombre_examen={formato.nombre_examen}
          codigo={formato.codigo}
          revision={formato.revision}
          cuerpo_html={formato.cuerpo_html}
        />
      </div>
    </div>
  )
}
