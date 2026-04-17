import { STATUS_META } from "@/lib/constants/status"
import type { CourseMatch } from "@/lib/hooks"

export function StatusBadge({ status }: { status: CourseMatch['status'] }) {
  const meta = STATUS_META[status]
  const Icon = meta.Icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color} ${meta.bg} ${meta.border}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}
