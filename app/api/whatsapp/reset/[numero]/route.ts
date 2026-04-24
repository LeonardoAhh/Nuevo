/**
 * DELETE /api/whatsapp/reset/[numero]
 * Elimina el registro de consulta de un empleado → puede volver a consultar.
 * Protegido: solo usuarios autenticados con rol admin/capacitacion.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero } = await params

  if (!numero || !/^\d{1,10}$/.test(numero)) {
    return NextResponse.json({ error: "Número inválido" }, { status: 400 })
  }

  // Verificar sesión activa (usuario autenticado)
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Eliminar registro con service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Role-gate: only 'dev' users can reset a consulta.
  // Defence-in-depth on top of the delete policy on whatsapp_consultas.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()
  if (profile?.role !== "dev") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabase
    .from("whatsapp_consultas")
    .delete()
    .eq("numero", numero.trim())

  if (error) {
    console.error("[WhatsApp reset] Error:", error.message)
    return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 })
  }

  // Log user id (not email) to avoid PII in Vercel log storage.
  console.log(`[WhatsApp reset] Consulta eliminada para numero=${numero} por user=${user.id}`)
  return NextResponse.json({ ok: true, numero })
}
