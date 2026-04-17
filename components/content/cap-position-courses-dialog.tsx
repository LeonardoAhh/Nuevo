"use client"

import React from "react"
import { BookOpen, X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { Position, PositionCourse, Course } from "@/lib/hooks"

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
  position, open, isReadOnly, loading, positionCourses, courses,
  assignCourseId, assignSaving, assignError,
  onClose, onAssignCourseChange, onAssignCourse, onRemoveCourse,
}: CapPositionCoursesDialogProps) {
  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-lg" title={position?.name ?? 'Cursos del puesto'} description="Cursos requeridos">
      <ModalToolbar
        title={position?.name ?? 'Cursos del puesto'}
        subtitle={`${(position?.department as any)?.name ?? ''} · Cursos requeridos`}
        saving={false}
        onClose={onClose}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col min-h-0 flex-1">
          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {positionCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay cursos asignados a este puesto.
              </p>
            ) : (
              <div className="space-y-1.5">
                {positionCourses.map((pc) => (
                  <div key={pc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">{pc.order_index}</span>
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm flex-1 min-w-0 truncate">{pc.course.name}</span>
                    {!isReadOnly && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => onRemoveCourse(pc.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign section — fixed at bottom */}
          {!isReadOnly && (
            <div className="shrink-0 border-t bg-card px-4 py-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asignar curso</p>
              <div className="flex gap-2">
                <Select value={assignCourseId} onValueChange={onAssignCourseChange}>
                  <SelectTrigger className="bg-muted flex-1 text-sm min-w-0">
                    <SelectValue placeholder="Selecciona un curso…" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-card"
                    position="popper" side="top" sideOffset={6}
                    avoidCollisions collisionPadding={12}
                    style={{ width: 'var(--radix-select-trigger-width)', maxHeight: '40dvh' }}
                  >
                    {courses
                      .filter(c => !positionCourses.some(pc => pc.course_id === c.id))
                      .map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="shrink-0" disabled={!assignCourseId || assignSaving} onClick={onAssignCourse}>
                  {assignSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {assignError && <p className="text-xs text-destructive">{assignError}</p>}
            </div>
          )}
        </div>
      )}
    </ResponsiveShell>
  )
}
