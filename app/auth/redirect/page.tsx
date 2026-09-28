import { Suspense } from "react"
import { PostLoginLoading } from "@/components/post-login-loading"

/**
 * Transición post-login.
 * Muestra la pantalla de carga animada, resuelve el rol del usuario
 * y redirige a la ruta correcta:
 *   - evaluador  → /desempeno
 *   - admin/dev  → ?to param (ruta original) o /
 */
export default function AuthRedirectPage() {
  return (
    <Suspense>
      <PostLoginLoading />
    </Suspense>
  )
}
