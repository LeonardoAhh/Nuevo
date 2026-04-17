"use client"
import { useState, useRef, useCallback } from "react"
import type { Employee, Course } from "@/lib/hooks/useCapacitacion"
import type { BulkCourseRow } from "@/lib/capacitacion/types"
import { normalizeDateToISO } from "@/lib/capacitacion/utils"
import { toast } from "sonner"

interface BulkImportRecord {
  employee_id: string
  course_id: string
  raw_course_name: string
  fecha_aplicacion: string | null
  calificacion: number | null
}

interface UseBulkImportOptions {
  employees: Employee[]
  courses: Course[]
  bulkImportCourseRecords: (records: BulkImportRecord[]) => Promise<{ success: boolean; inserted: number; error?: string }>
  onLoadCourses: () => void
}

export function useBulkImport({ employees, courses, bulkImportCourseRecords, onLoadCourses }: UseBulkImportOptions) {
  const [open, setOpen]           = useState(false)
  const [text, setText]           = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [rows, setRows]           = useState<BulkCourseRow[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const openDialog = useCallback(() => {
    setSuccess(null); setError(null); setParseError(null)
    setRows([]); setText(''); setOpen(true)
    if (courses.length === 0) onLoadCourses()
  }, [courses.length, onLoadCourses])

  const closeDialog = useCallback((nextOpen: boolean) => {
    if (!nextOpen) { setRows([]); setError(null); setParseError(null) }
    setOpen(nextOpen)
  }, [])

  const parseJSON = useCallback((rawText: string) => {
    setParseError(null)
    try {
      const parsed = JSON.parse(rawText)
      const arr: any[] = Array.isArray(parsed) ? parsed : [parsed]
      if (arr.length === 0) throw new Error('El JSON está vacío')
      const newRows: BulkCourseRow[] = arr.map((item, i) => {
        const numero      = String(item.numero ?? item.nn ?? item.NN ?? '').trim()
        const cursoRaw    = String(item.curso ?? item.course ?? item.Curso ?? '').trim()
        const fechaRaw    = String(item.fecha ?? item.date ?? item.Fecha ?? '').trim()
        const fecha       = normalizeDateToISO(fechaRaw)
        const calificacion = String(item.calificacion ?? item.Calificacion ?? item.score ?? '').trim()
        const emp    = employees.find(e => (e.numero ?? '') === numero && numero !== '')
        const course = courses.find(c => c.name === cursoRaw)
                    ?? courses.find(c => c.name.toLowerCase() === cursoRaw.toLowerCase())
        return {
          id: i, numero,
          employeeId: emp?.id ?? null,
          employeeName: emp?.nombre ?? '',
          cursoRaw,
          courseId: course?.id ?? null,
          fecha,
          calificacion,
        }
      })
      setRows(newRows)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'JSON inválido')
      setRows([])
    }
  }, [employees, courses])

  const handleParse = useCallback(() => {
    if (courses.length === 0) onLoadCourses()
    parseJSON(text)
  }, [text, courses.length, onLoadCourses, parseJSON])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const t = ev.target?.result as string
      setText(t); setParseError(null); setRows([])
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const updateRow = useCallback((id: number, field: 'numero' | 'fecha' | 'calificacion', value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (field === 'numero') {
        const emp = employees.find(e => (e.numero ?? '') === value && value !== '')
        updated.employeeId   = emp?.id ?? null
        updated.employeeName = emp?.nombre ?? ''
      }
      return updated
    }))
  }, [employees])

  const selectCourse = useCallback((id: number, courseId: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const course = courses.find(c => c.id === courseId)
      return { ...r, courseId: courseId || null, cursoRaw: course?.name ?? r.cursoRaw }
    }))
  }, [courses])

  const handleImport = useCallback(async () => {
    const valid = rows.filter(r => r.employeeId && r.courseId)
    if (valid.length === 0) {
      const msg = 'No hay registros válidos con empleado y curso resueltos'
      setError(msg); toast.error(msg); return
    }
    setSaving(true); setError(null)
    const records = valid.map(r => ({
      employee_id:      r.employeeId!,
      course_id:        r.courseId!,
      raw_course_name:  r.cursoRaw,
      fecha_aplicacion: r.fecha || null,
      calificacion:     r.calificacion ? (parseInt(r.calificacion) || null) : null,
    }))
    const result = await bulkImportCourseRecords(records)
    setSaving(false)
    if (result.success) {
      setSuccess(result.inserted); setRows([]); setText('')
      toast.success(`${result.inserted} registros importados correctamente`)
    } else {
      setError(result.error ?? 'Error al importar')
      toast.error(result.error ?? 'Error al importar')
    }
  }, [rows, bulkImportCourseRecords])

  const backToEdit = useCallback(() => { setRows([]); setError(null) }, [])

  return {
    open, text, parseError, rows, saving, error, success, fileRef,
    openDialog, closeDialog, setText, setParseError,
    handleParse, handleFile, updateRow, selectCourse, handleImport, backToEdit,
  }
}
