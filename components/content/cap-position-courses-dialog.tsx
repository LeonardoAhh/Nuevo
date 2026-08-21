"use client"

import React from "react"
import { BookOpen, X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell } from "@/components/ui/responsive-shell"
import { RedesignModalHeader } from "@/components/redesign/modal-header"
import { RedesignModalFooter } from "@/components/redesign/modal-footer"
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
      <RedesignModalHeader
        title={position?.name ?? 'Cursos del puesto'}
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
                  <div key={pc.id} className="flex items-center gap-3 p-2.5 rounded-md border border-border/60 bg-transparent hover:bg-muted/30 transition-colors shadow-none">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">{pc.order_index}</span>
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-ink flex-1 min-w-0 truncate">{pc.course.name}</span>
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
            <div className="shrink-0 border-t border-border/60 bg-card px-4 py-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asignar curso</p>
              <div className="flex gap-2">
                <Select value={assignCourseId} onValueChange={onAssignCourseChange}>
                  <SelectTrigger className="bg-transparent border-border/60 shadow-none flex-1 text-sm min-w-0">
                    <SelectValue placeholder="Selecciona un curso…" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-card border-border/60 shadow-md"
                    position="popper" side="top" sideOffset={6}
                    avoidCollisions collisionPadding={12}
                    style={{ width: 'var(--radix-select-trigger-width)', maxHeight: '40dvh' }}
                  >
                    {courses
                      .filter(c => !positionCourses.some(pc => pc.course_id === c.id))
                      .map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="shrink-0 shadow-none" disabled={!assignCourseId || assignSaving} onClick={onAssignCourse}>
                  {assignSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {assignError && <p className="text-xs text-destructive">{assignError}</p>}
            </div>
          )}
        </div>
      )}
      <RedesignModalFooter
        onCancel={onClose}
        cancelLabel="Cerrar"
      />
    </ResponsiveShell>
  )
}
