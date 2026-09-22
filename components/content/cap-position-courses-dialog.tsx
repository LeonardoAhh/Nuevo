"use client"

import { useId } from "react"
import { BookOpen, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalFooter, ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"
import type { Course, Position, PositionCourse } from "@/lib/hooks"

export interface CapPositionCoursesDialogProps {
  position: Position | null
  open: boolean
  isReadOnly: boolean
  loading: boolean
  positionCourses: PositionCourse[]
  courses: Course[]
  assignCourseId: string
  assignSaving: boolean
  assignError: string | null
  onClose: () => void
  onAssignCourseChange: (id: string) => void
  onAssignCourse: () => void
  onRemoveCourse: (positionCourseId: string) => void
}

export function CapPositionCoursesDialog({
  position,
  open,
  isReadOnly,
  loading,
  positionCourses,
  courses,
  assignCourseId,
  assignSaving,
  assignError,
  onClose,
  onAssignCourseChange,
  onAssignCourse,
  onRemoveCourse,
}: CapPositionCoursesDialogProps) {
  const courseSelectLabelId = useId()

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      size="sm"
      title={position?.name ?? "Cursos del puesto"}
      description="Cursos requeridos"
    >
      <ModalHeader title={position?.name ?? "Cursos del puesto"} subtitle="Cursos requeridos" onClose={onClose} />

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12" role="status" aria-label="Cargando cursos">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
            {positionCourses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="grid size-10 place-items-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                  <BookOpen className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Sin cursos asignados</p>
                  <p className="text-sm text-muted-foreground">Este puesto todavía no tiene cursos requeridos.</p>
                </div>
              </div>
            ) : (
              <ol className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {positionCourses.map(positionCourse => (
                  <li key={positionCourse.id} className="flex min-w-0 items-center gap-3 px-3 py-2.5">
                    <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {positionCourse.order_index}
                    </span>
                    <BookOpen className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">
                      {positionCourse.course.name}
                    </span>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveCourse(positionCourse.id)}
                        aria-label={`Quitar ${positionCourse.course.name}`}
                        title="Quitar curso"
                      >
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {!isReadOnly && (
            <div className="shrink-0 space-y-2 border-t border-border bg-card px-4 py-4 sm:px-6">
              <Label id={courseSelectLabelId}>Asignar curso</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={assignCourseId} onValueChange={onAssignCourseChange}>
                  <SelectTrigger className="min-w-0 flex-1" aria-labelledby={courseSelectLabelId}>
                    <SelectValue placeholder="Selecciona un curso…" />
                  </SelectTrigger>
                  <SelectContent matchTriggerWidth side="top" sideOffset={4}>
                    {courses
                      .filter(course => !positionCourses.some(positionCourse => positionCourse.course_id === course.id))
                      .map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  className="shrink-0"
                  disabled={!assignCourseId || assignSaving}
                  onClick={onAssignCourse}
                >
                  {assignSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                  Asignar
                </Button>
              </div>
              {assignError && <p className="text-xs text-destructive" role="alert">{assignError}</p>}
            </div>
          )}
        </div>
      )}

      <ModalFooter onCancel={onClose} cancelLabel="Cerrar" />
    </ResponsiveShell>
  )
}
