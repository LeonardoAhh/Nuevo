import type { EmpleadoPromocion } from "@/lib/promociones/types"
import { PROMOTION_DIALOG_TYPE } from "@/lib/promociones/dialog-config"

export function PromEmployeeSummary({ empleado }: { empleado: EmpleadoPromocion }) {
  return (
    <dl className="grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <dt className={PROMOTION_DIALOG_TYPE.label}>Colaborador</dt>
        <dd className={`mt-1 break-words ${PROMOTION_DIALOG_TYPE.primaryValue}`}>
          {empleado.nombre}
        </dd>
      </div>
      <div className="min-w-0 sm:text-right">
        <dt className={PROMOTION_DIALOG_TYPE.label}>Número</dt>
        <dd className={`mt-1 ${PROMOTION_DIALOG_TYPE.value}`}>{empleado.numero || "—"}</dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className={PROMOTION_DIALOG_TYPE.label}>Puesto actual</dt>
        <dd className={`mt-1 break-words ${PROMOTION_DIALOG_TYPE.value}`}>{empleado.puesto}</dd>
      </div>
    </dl>
  )
}
