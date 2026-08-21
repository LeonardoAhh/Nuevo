import { STATUS_META } from "@/lib/constants/status"
import type { CourseMatch } from "@/lib/hooks"
import { Badge } from "@/components/ui/badge"
import type { BadgeProps } from "@/components/ui/badge"

const STATUS_TO_VARIANT: Record<CourseMatch['status'], NonNullable<BadgeProps['variant']>> = {
  exact: "success",
  alias: "info",
  approximate: "warning",
  unknown: "error",
}

export function StatusBadge({ status }: { status: CourseMatch['status'] }) {
  const meta = STATUS_META[status]
  const Icon = meta.Icon
  const variant = STATUS_TO_VARIANT[status]
  return (
    <Badge variant={variant} size="sm">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}
