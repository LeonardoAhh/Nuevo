"use client"
import { useState, useRef, useCallback } from "react"
import type { ImportPreview } from "@/lib/hooks/useCapacitacion"
import { toast } from "sonner"

interface UseJsonImportOptions {
  parseJSON: (arr: any[]) => ImportPreview
  importData: (preview: ImportPreview) => Promise<{ success: boolean; error?: string }>
}

export function useJsonImport({ parseJSON, importData }: UseJsonImportOptions) {
  const [jsonText, setJsonText]       = useState("")
  const [preview, setPreview]         = useState<ImportPreview | null>(null)
  const [parseError, setParseError]   = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleParse = useCallback(() => {
    setParseError(null); setPreview(null); setImportSuccess(false)
    try {
      const parsed = JSON.parse(jsonText)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) throw new Error("El JSON está vacío")
      setPreview(parseJSON(arr))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "JSON inválido")
    }
  }, [jsonText, parseJSON])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonText(text); setParseError(null); setPreview(null); setImportSuccess(false)
      try {
        const parsed = JSON.parse(text)
        setPreview(parseJSON(Array.isArray(parsed) ? parsed : [parsed]))
      } catch {
        setParseError("No se pudo parsear el archivo JSON")
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [parseJSON])

  const handleImport = useCallback(async () => {
    if (!preview) return
    const result = await importData(preview)
    if (result.success) {
      setImportSuccess(true); setPreview(null); setJsonText("")
      toast.success('Catálogo importado correctamente')
    } else {
      toast.error(result.error ?? 'Error al importar catálogo')
    }
  }, [preview, importData])

  const handleReset = useCallback(() => {
    setJsonText(""); setPreview(null); setParseError(null); setImportSuccess(false)
  }, [])

  return {
    jsonText, setJsonText, preview, parseError, importSuccess,
    fileInputRef, handleParse, handleFileUpload, handleImport, handleReset,
  }
}
