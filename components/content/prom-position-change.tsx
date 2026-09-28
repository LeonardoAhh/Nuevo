import type { EmpleadoPromocion } from "@/lib/promociones/types"
import { PROMOTION_DIALOG_COPY, PROMOTION_DIALOG_TYPE } from "@/lib/promociones/dialog-config"

export function PromPositionChange({ empleado }: { empleado: EmpleadoPromocion }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border xs:grid-cols-2">
      <div className="min-w-0 space-y-1 bg-muted/60 p-3 sm:p-4">
        <dt className={PROMOTION_DIALOG_TYPE.label}>{PROMOTION_DIALOG_COPY.currentPosition}</dt>
        <dd className={`break-words ${PROMOTION_DIALOG_TYPE.primaryValue}`}>{empleado.puesto}</dd>
      </div>
      <div className="min-w-0 space-y-1 bg-background p-3 sm:p-4">
        <dt className={PROMOTION_DIALOG_TYPE.label}>{PROMOTION_DIALOG_COPY.newPosition}</dt>
        <dd className={`break-words ${PROMOTION_DIALOG_TYPE.accentValue}`}>
          {empleado.regla?.promocionA || PROMOTION_DIALOG_COPY.undefinedPosition}
        </dd>
      </div>
    </dl>
  )
}
