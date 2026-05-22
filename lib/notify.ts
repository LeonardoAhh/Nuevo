import { toast, type ExternalToast } from "sonner"
import { confirm as confirmDialog, type ConfirmOptions } from "@/components/ui/confirm-dialog"

// ─────────────────────────────────────────────────────────────────────────────
// Unified notification API
//   notify.success("Guardado")
//   notify.error("Sin conexión", { action: { label: "Reintentar", onClick } })
//   notify.warning("Sesión por expirar")
//   notify.info("3 cursos nuevos")
//   notify.promise(fn, { loading, success, error })
//   await notify.confirm({ title, tone: "destructive" })
// ─────────────────────────────────────────────────────────────────────────────

type Action = { label: string; onClick: () => void }

interface NotifyOptions extends Omit<ExternalToast, "action"> {
  action?: Action
}

const defaults = {
  success: 2500,
  info: 3000,
  warning: 4000,
  error: 5000,
} as const

function call(
  kind: "success" | "error" | "warning" | "info",
  message: string,
  opts?: NotifyOptions,
) {
  return toast[kind](message, {
    duration: defaults[kind],
    ...opts,
  })
}

export const notify = {
  success: (msg: string, opts?: NotifyOptions) => call("success", msg, opts),
  error: (msg: string, opts?: NotifyOptions) => call("error", msg, opts),
  warning: (msg: string, opts?: NotifyOptions) => call("warning", msg, opts),
  info: (msg: string, opts?: NotifyOptions) => call("info", msg, opts),

  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    msgs: { loading: string; success: string | ((data: T) => string); error: string | ((err: unknown) => string) },
  ) => toast.promise(promise, msgs),

  dismiss: (id?: string | number) => toast.dismiss(id),

  confirm: (options: ConfirmOptions) => confirmDialog(options),
}

export type { ConfirmOptions }
